// Ensure Node 22 environment does not break createRequire in ESM packages
if (typeof (globalThis as any).__dirname === 'string' && (globalThis as any).__dirname === '.') {
  delete (globalThis as any).__dirname;
}
process.env.DISABLE_HMR = 'true';

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Initialize Firebase Admin with safe fallback (supports both GCP Cloud Run & Vercel serverless)
let adminApp: any = null;
let db: any = null;
let adminAuth: any = null;

try {
  adminApp = initializeApp();
  db = getFirestore(adminApp, 'ai-studio-personalassistan-c66007a3-c835-4fd2-8987-3cb21ac48550');
  adminAuth = getAuth(adminApp);
} catch (e) {
  console.warn('Firebase Admin running in serverless/fallback mode:', e);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'demo-key',
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const analysisCache = new Map<string, { timestamp: number; advice: string }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache to prevent quota burn

function generateHeuristicAdvice(tasks: any[], expenses: any[], income: any[], goals: any[]): string {
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed);
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');

  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalIncome = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const netSavings = totalIncome - totalExpense;

  const expenseByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.category || 'General';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (Number(e.amount) || 0);
  });
  const topExpenseCat = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];

  return `### Strategic Reflection & Progress Overview

**1. Focus & Execution (Tasks & Goals)**
- **Completion Velocity**: ${completedTasks} of ${tasks.length} tasks completed (${tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%).
- **High-Priority Targets**: ${highPriorityTasks.length} critical items require your deliberate attention.
${highPriorityTasks.slice(0, 3).map(t => `  • ${t.description}`).join('\n') || '  • All high-priority actions are currently addressed.'}
- **Active Core Goals**: ${goals.length} active direction${goals.length === 1 ? '' : 's'} tracked. Keep your actions tightly aligned to your North Star principles (Growth, Competence, and Meaningful Impact).

**2. Resource & Financial Health**
- **Inflow**: ${totalIncome.toLocaleString()} RWF | **Outflow**: ${totalExpense.toLocaleString()} RWF
- **Net Flow**: ${netSavings >= 0 ? '+' : ''}${netSavings.toLocaleString()} RWF
${topExpenseCat ? `- **Dominant Expense Area**: ${topExpenseCat[0]} (${topExpenseCat[1].toLocaleString()} RWF). Maintain strict fiscal discipline to preserve independence and runway.` : ''}

**3. Actionable Next Step**
Select your single most consequential high-priority task, enter the **Sanctuary Mode** for an uninterrupted 45-minute sprint, and protect your energy from non-essential noise.

*(Automated synthesis active)*`;
}

export const app = express();
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Route for AI Analysis
app.post('/api/analyze', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Verify token if adminAuth is available
  let authenticatedUid = userId;
  const authHeader = req.headers.authorization;
  if (adminAuth && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      authenticatedUid = decoded.uid;
    } catch {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
  }

  if (authenticatedUid !== userId) {
    return res.status(403).json({ error: 'Forbidden: Cannot access another user data' });
  }

  // Check in-memory cache first to avoid hitting quota repeatedly
  const cached = analysisCache.get(authenticatedUid);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json({ advice: cached.advice, fromCache: true });
  }
  
  let tasks: any[] = [];
  let expenses: any[] = [];
  let income: any[] = [];
  let goals: any[] = [];
  let cvData: any = null;
  let galleryItems: any[] = [];

  try {
    if (db) {
      const [tasksSnap, expSnap, incSnap, goalsSnap, cvSnap, gallerySnap] = await Promise.all([
        db.collection('tasks').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('expenses').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('income').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('goals').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('cv_profiles').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('gallery').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] }))
      ]);

      tasks = tasksSnap.docs.map((doc: any) => doc.data());
      expenses = expSnap.docs.map((doc: any) => doc.data());
      income = incSnap.docs.map((doc: any) => doc.data());
      goals = goalsSnap.docs.map((doc: any) => doc.data());
      if (cvSnap.docs.length > 0) {
        cvData = cvSnap.docs[0].data();
      }
      galleryItems = gallerySnap.docs.map((doc: any) => ({
        title: doc.data().title,
        category: doc.data().category,
        date: doc.data().date,
        caption: doc.data().caption
      }));
    }

    const cvSummary = cvData ? {
      fullName: cvData.fullName,
      title: cvData.title,
      certifications: cvData.certifications?.map((c: any) => c.name),
      topSkills: cvData.skillCategories?.flatMap((s: any) => s.skills)?.slice(0, 12),
      recentRoles: cvData.experiences?.map((e: any) => `${e.role} at ${e.company}`)?.slice(0, 4)
    } : 'No CV profile logged yet';

    const prompt = `You are a strategic advisor for a high-performing individual who values growth, excellence, competence, and meaningful impact.
Analyze the following personal OS data (including active tasks, fiscal balance, goals, career portfolio/CV, and milestone gallery) and provide a concise, high-impact strategic advisory plan with:
1. Focus & Execution Assessment
2. Financial Sustainability Check
3. Career Competence & Leverage (grounded in their CV history, certifications, and milestones)
4. High-Leverage Recommendations for the day.

User Data:
- Tasks: ${JSON.stringify(tasks.slice(0, 15))}
- Goals: ${JSON.stringify(goals.slice(0, 10))}
- Expenses: ${JSON.stringify(expenses.slice(0, 15))}
- Income: ${JSON.stringify(income.slice(0, 10))}
- Career Portfolio (CV): ${JSON.stringify(cvSummary)}
- Visual Milestones & Gallery: ${JSON.stringify(galleryItems.slice(0, 8))}`;

    let adviceText = '';

    // Try with gemini-3.8-flash
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      if (response && response.text) {
        adviceText = response.text;
      }
    } catch {
      // Fallback to gemini-3.1-flash-lite
      try {
        const liteResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });
        if (liteResponse && liteResponse.text) {
          adviceText = liteResponse.text;
        }
      } catch {
        // Fallback to heuristic
      }
    }

    if (!adviceText) {
      adviceText = generateHeuristicAdvice(tasks, expenses, income, goals);
    }

    // Cache result
    analysisCache.set(userId, { timestamp: Date.now(), advice: adviceText });

    return res.json({ advice: adviceText });
  } catch {
    const fallbackAdvice = generateHeuristicAdvice(tasks, expenses, income, goals);
    analysisCache.set(userId, { timestamp: Date.now(), advice: fallbackAdvice });
    return res.json({ 
      advice: fallbackAdvice,
      isFallback: true 
    });
  }
});

// API Route for Chatbot with deep context
app.post('/api/chat', async (req, res) => {
  const { input, previousInteractionId, userId } = req.body;
  if (!input) {
    return res.status(400).json({ error: 'Missing input text' });
  }

  let contextualDataPrompt = '';
  if (userId && db) {
    try {
      const [cvSnap, famSnap, galSnap] = await Promise.all([
        db.collection('cv_profiles').where('userId', '==', userId).get().catch(() => ({ docs: [] })),
        db.collection('family_members').where('userId', '==', userId).get().catch(() => ({ docs: [] })),
        db.collection('gallery').where('userId', '==', userId).get().catch(() => ({ docs: [] }))
      ]);

      let cvInfo = '';
      if (cvSnap.docs.length > 0) {
        const c = cvSnap.docs[0].data();
        cvInfo = `\n[User's Curriculum Vitae / Career Profile]:
- Name: ${c.fullName || 'User'}, Title: ${c.title || 'Professional'}
- Summary: ${c.summary || 'Not provided'}
- Certifications: ${c.certifications?.map((cert: any) => cert.name + (cert.issuer ? ' from ' + cert.issuer : '')).join(', ') || 'None listed yet'}
- Experience: ${c.experiences?.map((e: any) => `${e.role} at ${e.company} (${e.startDate || ''} - ${e.endDate || 'Present'})`).join('; ') || 'None listed'}
- Skills: ${c.skillCategories?.map((s: any) => `${s.category}: ${s.skills?.join(', ')}`).join(' | ') || 'None listed'}
- Projects: ${c.projects?.map((p: any) => `${p.title} (${p.techStack?.join(', ')})`).join('; ') || 'None listed'}`;
      }

      let famInfo = '';
      if (famSnap.docs.length > 0) {
        famInfo = `\n[User's Family Tree & Lineage History (Starting from Mom's Grandpa / Ancestors)]:
${famSnap.docs.map((d: any) => {
  const m = d.data();
  return `- ${m.fullName} (${m.relationship}, Gen ${m.generation}): Born ${m.birthYear || 'Unknown'}${m.passedYear ? ', Passed ' + m.passedYear : (m.isAlive ? ' (Alive)' : '')}. Occupation: ${m.occupation || 'N/A'}. Bio: ${m.notesBio || 'None'}`;
}).slice(0, 20).join('\n')}`;
      }

      let galInfo = '';
      if (galSnap.docs.length > 0) {
        galInfo = `\n[User's Visual Milestones & Gallery]:
${galSnap.docs.map((d: any) => `- ${d.data().title} (${d.data().category}, ${d.data().date}): ${d.data().caption || ''}`).slice(0, 10).join('\n')}`;
      }

      contextualDataPrompt = `${cvInfo}${famInfo}${galInfo}`;
    } catch {
      // Continue if fetching fails
    }
  }
  
  try {
    const systemInstruction = `You are an intelligent, deeply thoughtful personal assistant and executive advisor for an ambitious learner and builder.
You have access to the user's personal operating system including their full Curriculum Vitae (CV/Resume), certifications, work history, family ancestral tree (rooted in Mom's grandpa down through descendants), and milestone gallery.
When asked about their career, job applications, or tailoring their CV, give concrete, highly strategic guidance grounded in their real experiences and certifications.
When asked about their family heritage, honor their lineage, connect the generations, and help preserve their story for future descendants.
Keep responses supportive, articulate, concise, and grounded in core values of competence, deep focus, and purposeful impact.
${contextualDataPrompt}`;

    // First attempt with gemini-3.8-flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: input }]
        }
      ],
      config: { systemInstruction }
    });
    
    return res.json({ 
      response: response.text?.trim() || "I'm here to help you stay focused on your top priorities.",
      interactionId: previousInteractionId 
    });
  } catch {
    // Try fallback to gemini-3.1-flash-lite
    try {
      const liteResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [{ text: input }]
          }
        ],
        config: {
          systemInstruction: "You are an intelligent, thoughtful personal assistant. Keep responses concise and focused."
        }
      });
      if (liteResponse && liteResponse.text) {
        return res.json({
          response: liteResponse.text.trim(),
          interactionId: previousInteractionId
        });
      }
    } catch {
      // Fallback gracefully below
    }

    // Context-aware intelligent fallback when rate limits occur on free tier
    let fallbackReply = "I'm currently operating in offline sanctuary mode due to temporary API rate limits. Focus on your highest priority task on your board, protect a 45-minute uninterrupted sprint, and I'll be ready for further deep conversations shortly!";
    
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('cv') || lowerInput.includes('resume') || lowerInput.includes('job') || lowerInput.includes('certif')) {
      fallbackReply = "You can view, edit, and tailor your full Curriculum Vitae directly from the Curriculum Vitae card at the bottom. The AI Tailor tool lets you paste any target job description to match your certifications and career history!";
    } else if (lowerInput.includes('family') || lowerInput.includes('grandpa') || lowerInput.includes('tree') || lowerInput.includes('generation')) {
      fallbackReply = "Your family tree is preserved in the Ancestral Heritage module at the bottom. It starts from Mom's grandpa down to the newest generations, keeping your roots alive forever.";
    } else if (lowerInput.includes('photo') || lowerInput.includes('gallery') || lowerInput.includes('picture')) {
      fallbackReply = "Your visual milestones and memories are safely stored in your Personal Gallery at the bottom, categorized by milestones, certificates, and work snapshots.";
    } else if (lowerInput.includes('task') || lowerInput.includes('priority') || lowerInput.includes('todo')) {
      fallbackReply = "Tip for today: Pin your single most impactful task to the top of your Kanban board using the pin icon, silence external notifications, and log your progress reflection once completed!";
    } else if (lowerInput.includes('goal') || lowerInput.includes('north star')) {
      fallbackReply = "Every daily task should directly advance one of your North Star goals. If a task doesn't contribute to your competence, runway, or growth, consider delegating or eliminating it.";
    } else if (lowerInput.includes('expense') || lowerInput.includes('budget') || lowerInput.includes('money')) {
      fallbackReply = "Fiscal discipline preserves your runway and independence. Regularly log expenses using the quick-capture bar to keep total outflow strictly within your targets.";
    }

    return res.status(200).json({ 
      response: fallbackReply,
      isRateLimited: true,
      interactionId: previousInteractionId
    });
  }
});

// Dedicated API Route to Tailor CV for a specific Job Description
app.post('/api/cv/tailor', async (req, res) => {
  const { jobTitle, jobDescription, targetCompany, tone, cvProfile } = req.body;
  if (!cvProfile) {
    return res.status(400).json({ error: 'Missing CV profile data' });
  }

  const prompt = `You are a world-class executive resume strategist and career coach.
Given this user's MASTER Curriculum Vitae (with all history, education, and certifications) and a TARGET JOB opportunity, create a rigorously tailored CV optimization and alignment plan WITHOUT losing their core achievements.

TARGET ROLE:
- Job Title: ${jobTitle || 'Target Position'}
- Target Company: ${targetCompany || 'Prospective Employer'}
- Desired Tone: ${tone || 'impact-driven'}
- Job Description / Requirements:
"""
${jobDescription || 'General high-impact technical/leadership role requiring execution, problem-solving, and domain mastery'}
"""

USER'S MASTER CV DATA:
${JSON.stringify(cvProfile, null, 2)}

Return a valid JSON object matching this exact schema:
{
  "jobTitle": "${jobTitle || 'Target Position'}",
  "targetCompany": "${targetCompany || ''}",
  "executiveSummary": "A powerful 3-4 sentence professional summary tailored specifically to the requirements of the job, weaving in their background, certifications, and demonstrated strengths.",
  "tailoredHighlights": [
    "3 to 5 bullet points highlighting the most persuasive match points between the user's master CV and the target role"
  ],
  "customizedExperiences": [
    {
      "role": "Role Title",
      "company": "Company Name",
      "dates": "Dates",
      "bulletPoints": [
        "2 to 3 action-oriented achievement bullet points using strong verbs (e.g. Engineered, Spearheaded, Optimized) and highlighting metrics/technologies from the master CV that directly solve the target company's needs"
      ]
    }
  ],
  "keySkills": ["List of 8-12 top skills from the user's profile that directly align with the job description"],
  "certifications": ["List of the user's certifications that give them an edge for this role"],
  "fitScoreExplanation": "A brief analysis (2-3 sentences) explaining why the user is qualified, any skill gaps to address in interviews, and talking points."
}
Respond ONLY with raw JSON, no markdown code fence blocks or backticks.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch {
    const exp = cvProfile.experiences || [];
    const skills = cvProfile.skillCategories?.flatMap((c: any) => c.skills) || [];
    const certs = cvProfile.certifications?.map((c: any) => c.name) || [];

    return res.json({
      jobTitle: jobTitle || 'Target Position',
      targetCompany: targetCompany || '',
      executiveSummary: `${cvProfile.fullName || 'Accomplished professional'} with proven expertise across ${skills.slice(0, 4).join(', ') || 'key technical domains'}. Certified in ${certs.slice(0, 2).join(', ') || 'specialized technologies'}, dedicated to delivering high-impact outcomes for ${targetCompany || 'the organization'}.`,
      tailoredHighlights: [
        `Demonstrated proficiency in ${skills.slice(0, 3).join(', ')} matching the target job competencies`,
        `Practical track record spanning ${exp.length} professional roles with a focus on execution excellence`,
        `Certified credentials in ${certs.join(', ') || 'relevant professional disciplines'}`
      ],
      customizedExperiences: exp.slice(0, 3).map((e: any) => ({
        role: e.role,
        company: e.company,
        dates: `${e.startDate || ''} - ${e.endDate || 'Present'}`,
        bulletPoints: e.achievements && e.achievements.length > 0 
          ? e.achievements.slice(0, 3) 
          : [e.description || 'Delivered key initiatives aligned with organizational milestones.']
      })),
      keySkills: skills.slice(0, 10),
      certifications: certs,
      fitScoreExplanation: `Strong baseline alignment based on ${exp.length} career milestones and ${certs.length} formal certifications. Emphasize your hands-on problem-solving experience during the interview process.`
    });
  }
});

// Dedicated API Route to generate a Family Heritage Chronicle
app.post('/api/family/chronicle', async (req, res) => {
  const { members } = req.body;
  if (!members || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: 'No family members provided' });
  }

  const prompt = `You are a warm, eloquent family genealogist and historian.
Analyze the following ancestral family records starting from Mom's grandpa (the root patriarch/matriarch) down through generations, siblings, children, and branches:

${JSON.stringify(members, null, 2)}

Write an inspiring, beautifully articulated "Family Heritage Chronicle" (3 to 5 paragraphs) that:
1. Honors the founding root generation (Mom's grandpa and his era).
2. Traces how the family branches expanded, noting occupations, virtues, and locations.
3. Celebrates the present generation and future descendants, providing a treasured written heirloom they will cherish forever.

Write in a dignified, uplifting, and heartfelt tone.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return res.json({ chronicle: response.text?.trim() || '' });
  } catch {
    return res.json({
      chronicle: `From the enduring foundation laid by Mom's grandpa, our family's story is one of perseverance, dignity, and deep connection. Spanning across generations and branching into diverse paths and professions, every member carries forward the core values and legacy of our ancestors. This chronicle stands as a living testament to our shared heritage—preserving our roots and inspiring all future generations to come.`
    });
  }
});

// API Route for Voice Transcription
app.post('/api/transcribe', async (req, res) => {
  const { audioData, mimeType } = req.body;
  if (!audioData) {
    return res.status(400).json({ error: 'Missing audio data' });
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: audioData, mimeType: mimeType || 'audio/webm' } },
            { text: "Accurately transcribe this audio recording. Output only the transcript text without preamble." }
          ]
        }
      ]
    });
    res.json({ text: response.text?.trim() || '' });
  } catch {
    res.status(200).json({ 
      text: '', 
      error: 'Voice transcription is currently resting due to temporary rate limits. You can still type directly into the input.' 
    });
  }
});

// Standalone server starter (Used for Cloud Run, Docker, and local dev)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

// Start standalone server only when not executing inside a serverless lambda (e.g. Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export default app;

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

// Initialize Firebase Admin
const adminApp = initializeApp();
const db = getFirestore(adminApp, 'ai-studio-personalassistan-c66007a3-c835-4fd2-8987-3cb21ac48550');
const adminAuth = getAuth(adminApp);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
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

async function startServer() {
  const app = express();
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

    // Verify token to enforce strict cross-user data isolation
    let authenticatedUid = userId;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        authenticatedUid = decoded.uid;
      } catch (tokenErr) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    } else {
      return res.status(401).json({ error: 'Authentication required. Authorization header missing.' });
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
      // Fetch data safely
      const [tasksSnap, expSnap, incSnap, goalsSnap, cvSnap, gallerySnap] = await Promise.all([
        db.collection('tasks').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('expenses').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('income').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('goals').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('cv_profiles').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] })),
        db.collection('gallery').where('userId', '==', authenticatedUid).get().catch(() => ({ docs: [] }))
      ]);

      tasks = tasksSnap.docs.map(doc => doc.data());
      expenses = expSnap.docs.map(doc => doc.data());
      income = incSnap.docs.map(doc => doc.data());
      goals = goalsSnap.docs.map(doc => doc.data());
      if (cvSnap.docs.length > 0) {
        cvData = cvSnap.docs[0].data();
      }
      galleryItems = gallerySnap.docs.map(doc => ({
        title: doc.data().title,
        category: doc.data().category,
        date: doc.data().date,
        caption: doc.data().caption
      }));

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

      // Try with gemini-3.8-flash without wasteful search grounding on private personal data
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        if (response && response.text) {
          adviceText = response.text;
        }
      } catch (err: any) {
        // Fallback to gemini-3.1-flash-lite which has higher rate limits
        try {
          const liteResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
          });
          if (liteResponse && liteResponse.text) {
            adviceText = liteResponse.text;
          }
        } catch {
          // Gracefully continue to heuristic fallback
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

  // API Route for Chatbot
  app.post('/api/chat', async (req, res) => {
    const { input, previousInteractionId, userId } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Missing input text' });
    }
    
    try {
      // First attempt with gemini-3.8-flash
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: input }]
          }
        ],
        config: {
          systemInstruction: "You are an intelligent, thoughtful personal assistant for an ambitious learner and builder. Keep responses concise, supportive, actionable, and grounded in core values of competence, deep focus, and purposeful impact."
        }
      });
      
      return res.json({ 
        response: response.text?.trim() || "I'm here to help you stay focused on your top priorities.",
        interactionId: previousInteractionId 
      });
    } catch (primaryErr: any) {
      // Try fallback to gemini-3.1-flash-lite which consumes fewer tokens & higher quota limits
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
      if (lowerInput.includes('task') || lowerInput.includes('priority') || lowerInput.includes('todo')) {
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

  // API Route for Transcription
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

  // Vite middleware
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

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
  });
}

startServer();

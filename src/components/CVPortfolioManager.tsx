import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code, 
  FolderGit2, 
  Sparkles, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Check, 
  Copy, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  Search,
  Filter,
  ShieldCheck,
  FileCheck,
  RotateCcw,
  Download
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { CVProfile, CVExperience, CVEducation, CVCertification, CVSkillCategory, CVProject, TailoredCVResult } from '../types';
import { 
  RWEMERA_MASTER_PROFILE, 
  RWEMERA_CERTIFICATIONS, 
  RWEMERA_EDUCATION, 
  RWEMERA_SKILLS, 
  RWEMERA_CIVIL_RECORDS 
} from '../data/userCertificates';

export default function CVPortfolioManager({ onBack }: { onBack?: () => void }) {
  const [profile, setProfile] = useState<CVProfile>({
    ...RWEMERA_MASTER_PROFILE,
    userId: auth.currentUser?.uid || '',
    email: auth.currentUser?.email || RWEMERA_MASTER_PROFILE.email
  });

  const [docId, setDocId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'master' | 'credentials' | 'tailor' | 'print'>('master');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Credentials Archive filters & search
  const [credSearch, setCredSearch] = useState('');
  const [credCategory, setCredCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Scattered certificates temporary tracker
  const [scatterTitle, setScatterTitle] = useState('');
  const [scatterIssuer, setScatterIssuer] = useState('');
  const [scatterYear, setScatterYear] = useState('');
  const [scatterNotes, setScatterNotes] = useState('');

  // AI Tailor State
  const [tailorJobTitle, setTailorJobTitle] = useState('');
  const [tailorCompany, setTailorCompany] = useState('');
  const [tailorJobDesc, setTailorJobDesc] = useState('');
  const [tailorTone, setTailorTone] = useState<'impact-driven' | 'technical' | 'executive'>('impact-driven');
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredResult, setTailoredResult] = useState<TailoredCVResult | null>(null);
  const [copied, setCopied] = useState(false);

  // New item draft states
  const [newSkillCat, setNewSkillCat] = useState('');
  const [newSkillItem, setNewSkillItem] = useState('');

  // Real-time Firestore sync
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'cv_profiles'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setDocId(docSnap.id);
        const data = docSnap.data() as CVProfile;
        setProfile(prev => ({
          ...prev,
          ...data,
          fullName: data.fullName || prev.fullName,
          title: data.title || prev.title,
          email: data.email || prev.email,
          experiences: (data.experiences && data.experiences.length > 0) ? data.experiences : prev.experiences,
          education: (data.education && data.education.length > 0) ? data.education : prev.education,
          certifications: (data.certifications && data.certifications.length > 0) ? data.certifications : prev.certifications,
          skillCategories: (data.skillCategories && data.skillCategories.length > 0) ? data.skillCategories : prev.skillCategories,
          projects: (data.projects && data.projects.length > 0) ? data.projects : prev.projects
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSyncUploadedCertificates = async () => {
    setIsSaving(true);
    const updatedProfile: CVProfile = {
      ...profile,
      fullName: 'RWEMERA Ally Hamis',
      title: 'Social Work & Humanitarian Operations Specialist | High Performance Advocate',
      email: auth.currentUser?.email || 'rwemera30@gmail.com',
      location: 'Kigali, Rwanda (Kacyiru, Gasabo / Ngoma & Kirehe)',
      summary: RWEMERA_MASTER_PROFILE.summary,
      certifications: RWEMERA_CERTIFICATIONS,
      education: RWEMERA_EDUCATION,
      skillCategories: RWEMERA_SKILLS,
      experiences: RWEMERA_MASTER_PROFILE.experiences,
      projects: RWEMERA_MASTER_PROFILE.projects
    };

    setProfile(updatedProfile);

    if (auth.currentUser) {
      try {
        const targetId = docId || auth.currentUser.uid;
        await setDoc(doc(db, 'cv_profiles', targetId), {
          ...updatedProfile,
          userId: auth.currentUser.uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setDocId(targetId);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        console.error('Failed to sync master certificates:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const targetId = docId || auth.currentUser.uid;
      await setDoc(doc(db, 'cv_profiles', targetId), {
        ...profile,
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setDocId(targetId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save CV:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExperience = () => {
    const newExp: CVExperience = {
      id: 'exp-' + Date.now(),
      role: 'Software Engineer',
      company: 'Organization Name',
      startDate: '2023',
      endDate: 'Present',
      current: true,
      description: 'Key role scope and strategic responsibilities.',
      achievements: ['Delivered core platform milestone on schedule.']
    };
    setProfile(prev => ({ ...prev, experiences: [newExp, ...prev.experiences] }));
  };

  const handleRemoveExperience = (id: string) => {
    setProfile(prev => ({ ...prev, experiences: prev.experiences.filter(e => e.id !== id) }));
  };

  const handleAddEducation = () => {
    const newEdu: CVEducation = {
      id: 'edu-' + Date.now(),
      institution: 'University Name',
      degree: 'Bachelor Degree',
      field: 'Major Field',
      startYear: '2020',
      endYear: '2024'
    };
    setProfile(prev => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const handleRemoveEducation = (id: string) => {
    setProfile(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
  };

  const handleAddCertification = () => {
    const newCert: CVCertification = {
      id: 'cert-' + Date.now(),
      name: 'Professional Certification Name',
      issuer: 'Issuing Organization',
      issueDate: '2024',
      credentialId: 'CRED-' + Math.floor(10000 + Math.random() * 90000)
    };
    setProfile(prev => ({ ...prev, certifications: [...prev.certifications, newCert] }));
  };

  const handleRemoveCertification = (id: string) => {
    setProfile(prev => ({ ...prev, certifications: prev.certifications.filter(c => c.id !== id) }));
  };

  const handleAddSkillToCategory = (catIdx: number, skill: string) => {
    if (!skill.trim()) return;
    setProfile(prev => {
      const updated = [...prev.skillCategories];
      if (!updated[catIdx].skills.includes(skill.trim())) {
        updated[catIdx].skills.push(skill.trim());
      }
      return { ...prev, skillCategories: updated };
    });
  };

  const handleRemoveSkill = (catIdx: number, skillName: string) => {
    setProfile(prev => {
      const updated = [...prev.skillCategories];
      updated[catIdx].skills = updated[catIdx].skills.filter(s => s !== skillName);
      return { ...prev, skillCategories: updated };
    });
  };

  const handleAddCategory = () => {
    if (!newSkillCat.trim()) return;
    setProfile(prev => ({
      ...prev,
      skillCategories: [...prev.skillCategories, { category: newSkillCat.trim(), skills: [] }]
    }));
    setNewSkillCat('');
  };

  const handleRemoveCategory = (catIdx: number) => {
    setProfile(prev => ({
      ...prev,
      skillCategories: prev.skillCategories.filter((_, idx) => idx !== catIdx)
    }));
  };

  const handleAddProject = () => {
    const newProj: CVProject = {
      id: 'proj-' + Date.now(),
      title: 'Featured Initiative / Project',
      role: 'Lead Architect',
      description: 'High-impact project description and measurable outcomes.',
      techStack: ['TypeScript', 'Cloud'],
      url: ''
    };
    setProfile(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
  };

  const handleRemoveProject = (id: string) => {
    setProfile(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  // AI Tailor trigger
  const handleGenerateTailoredCV = async () => {
    if (!tailorJobTitle && !tailorJobDesc) return;
    setIsTailoring(true);
    try {
      const res = await fetch('/api/cv/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: tailorJobTitle,
          targetCompany: tailorCompany,
          jobDescription: tailorJobDesc,
          tone: tailorTone,
          cvProfile: profile
        })
      });
      const data = await res.json();
      setTailoredResult(data);
    } catch (err) {
      console.error('Tailor error:', err);
    } finally {
      setIsTailoring(false);
    }
  };

  const copyTailoredText = () => {
    if (!tailoredResult) return;
    const text = `# ${profile.fullName} - Tailored Resume
**Target Role:** ${tailoredResult.jobTitle} ${tailoredResult.targetCompany ? 'at ' + tailoredResult.targetCompany : ''}
**Contact:** ${profile.email} | ${profile.phone} | ${profile.location}

## Executive Summary
${tailoredResult.executiveSummary}

## Strategic Key Strengths & Fit Highlights
${tailoredResult.tailoredHighlights.map(h => `- ${h}`).join('\n')}

## Tailored Experience
${tailoredResult.customizedExperiences.map(e => `### ${e.role} | ${e.company} (${e.dates})
${e.bulletPoints.map(b => `- ${b}`).join('\n')}`).join('\n\n')}

## Key Competencies
${tailoredResult.keySkills.join(', ')}

## Certifications
${tailoredResult.certifications.join(', ')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      
      // Delay cleanup by 30 seconds so browser finishes download stream without cancellation
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      }, 30000);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDownloadHTML = () => {
    const safeName = (profile.fullName || 'RWEMERA_Ally_Hamis').replace(/\s+/g, '_');
    const filename = `${safeName}_Curriculum_Vitae.html`;
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${profile.fullName || 'Curriculum Vitae'} - CV</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; max-width: 820px; margin: 0 auto; padding: 24px; background: #fff; }
    h1 { font-size: 26px; margin: 0 0 4px 0; text-transform: uppercase; color: #0f172a; letter-spacing: -0.5px; }
    .title { font-size: 15px; font-weight: 600; color: #4338ca; margin-bottom: 10px; }
    .contact-row { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: #475569; margin-bottom: 18px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; font-family: monospace; }
    h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 18px; margin-bottom: 10px; }
    .exp-item { margin-bottom: 14px; }
    .exp-header { display: flex; justify-content: space-between; font-weight: 700; color: #0f172a; }
    .exp-sub { font-weight: 600; color: #4338ca; font-size: 12px; }
    .exp-dates { font-family: monospace; font-size: 11px; color: #64748b; font-weight: normal; }
    ul { margin: 6px 0; padding-left: 20px; }
    li { margin-bottom: 3px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#e0e7ff; color:#3730a3; padding:12px; border-radius:8px; margin-bottom:20px; text-align:center; font-weight:600;">
    📄 Print-Ready Official Curriculum Vitae — Press <strong>Ctrl + P</strong> (or <strong>Cmd + P</strong> on Mac) in your browser to Print or "Save as PDF".
  </div>
  <h1>${profile.fullName}</h1>
  <div class="title">${profile.title}</div>
  <div class="contact-row">
    ${profile.email ? `<span>✉ ${profile.email}</span>` : ''}
    ${profile.phone ? `<span>📞 ${profile.phone}</span>` : ''}
    ${profile.location ? `<span>📍 ${profile.location}</span>` : ''}
    ${profile.linkedin ? `<span>🔗 ${profile.linkedin}</span>` : ''}
    ${profile.github ? `<span>💻 ${profile.github}</span>` : ''}
  </div>

  ${profile.summary ? `
    <h2>Executive Profile</h2>
    <p style="margin: 0; line-height: 1.6;">${profile.summary}</p>
  ` : ''}

  <h2>Professional Experience</h2>
  ${profile.experiences.map(e => `
    <div class="exp-item">
      <div class="exp-header">
        <span>${e.role} — <span class="exp-sub">${e.company}</span></span>
        <span class="exp-dates">${e.startDate} – ${e.endDate || 'Present'}</span>
      </div>
      ${e.description ? `<p style="margin: 4px 0;">${e.description}</p>` : ''}
      ${e.achievements && e.achievements.length > 0 ? `
        <ul>
          ${e.achievements.map(a => `<li>${a}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `).join('')}

  <div class="grid-2">
    <div>
      <h2>Education</h2>
      ${profile.education.map(edu => `
        <div style="margin-bottom: 10px;">
          <div style="font-weight: 700; color: #0f172a;">${edu.degree} in ${edu.field}</div>
          <div style="color: #475569; font-size: 11px;">${edu.institution} (${edu.startYear} – ${edu.endYear})</div>
          ${edu.honors ? `<div style="color: #4338ca; font-weight: 600; font-size: 11px;">${edu.honors}</div>` : ''}
        </div>
      `).join('')}
    </div>

    <div>
      <h2>Certifications & Accreditations</h2>
      ${profile.certifications.map(c => `
        <div style="margin-bottom: 8px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${c.name}</div>
          <div style="color: #64748b; font-size: 11px;">${c.issuer} • ${c.issueDate} ${c.credentialId ? `(ID: ${c.credentialId})` : ''}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <h2>Core Competencies</h2>
  ${profile.skillCategories.map(sc => `
    <div style="margin-bottom: 6px;">
      <strong style="color: #0f172a;">${sc.category}:</strong>
      <span style="color: #334155;">${sc.skills.join(', ')}</span>
    </div>
  `).join('')}
</body>
</html>`;

    triggerDownload(htmlContent, filename, 'text/html;charset=utf-8');
  };

  const handleDownloadWordDoc = () => {
    const safeName = (profile.fullName || 'RWEMERA_Ally_Hamis').replace(/\s+/g, '_');
    const filename = `${safeName}_CV.doc`;
    const docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${profile.fullName} - CV</title>
<style>
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #222; }
h1 { font-size: 18pt; text-transform: uppercase; color: #000; margin-bottom: 2pt; }
.sub { font-size: 12pt; font-weight: bold; color: #4338ca; margin-bottom: 8pt; }
.contact { font-size: 10pt; color: #555; margin-bottom: 12pt; border-bottom: 1.5pt solid #000; padding-bottom: 6pt; }
h2 { font-size: 12pt; text-transform: uppercase; color: #333; border-bottom: 1pt solid #ccc; padding-bottom: 2pt; margin-top: 14pt; }
.exp-role { font-weight: bold; color: #000; }
.exp-date { font-style: italic; color: #666; font-size: 10pt; }
</style>
</head>
<body>
<h1>${profile.fullName}</h1>
<div class='sub'>${profile.title}</div>
<div class='contact'>${profile.email} | ${profile.phone || ''} | ${profile.location || ''}</div>
<h2>Executive Summary</h2>
<p>${profile.summary}</p>
<h2>Professional Experience</h2>
${profile.experiences.map(e => `
<div>
  <p><span class='exp-role'>${e.role} — ${e.company}</span> <span class='exp-date'>(${e.startDate} - ${e.endDate || 'Present'})</span></p>
  <p>${e.description || ''}</p>
  ${e.achievements ? `<ul>${e.achievements.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
</div>
`).join('')}
<h2>Education</h2>
${profile.education.map(edu => `
<p><strong>${edu.degree} in ${edu.field}</strong> — ${edu.institution} (${edu.startYear} - ${edu.endYear})<br/><em>${edu.honors || ''}</em></p>
`).join('')}
<h2>Certifications</h2>
${profile.certifications.map(c => `
<p><strong>${c.name}</strong> — ${c.issuer} (${c.issueDate}) ${c.credentialId ? '[ID: ' + c.credentialId + ']' : ''}</p>
`).join('')}
<h2>Core Competencies</h2>
${profile.skillCategories.map(sc => `
<p><strong>${sc.category}:</strong> ${sc.skills.join(', ')}</p>
`).join('')}
</body>
</html>`;
    triggerDownload(docContent, filename, 'application/msword;charset=utf-8');
  };

  const handleDownloadPlainText = () => {
    const safeName = (profile.fullName || 'RWEMERA_Ally_Hamis').replace(/\s+/g, '_');
    const filename = `${safeName}_CV_ATS.txt`;
    const text = `===============================================================
${profile.fullName.toUpperCase()}
${profile.title}
===============================================================
Contact: ${profile.email} | ${profile.phone || ''} | ${profile.location || ''}
LinkedIn: ${profile.linkedin || ''}
GitHub/Portfolio: ${profile.github || ''}

EXECUTIVE PROFILE:
---------------------------------------------------------------
${profile.summary}

PROFESSIONAL EXPERIENCE:
---------------------------------------------------------------
${profile.experiences.map(e => `
* ${e.role.toUpperCase()} | ${e.company} (${e.startDate} - ${e.endDate || 'Present'})
  ${e.description}
  Achievements:
${(e.achievements || []).map(a => `  - ${a}`).join('\n')}
`).join('\n')}

EDUCATION:
---------------------------------------------------------------
${profile.education.map(edu => `
* ${edu.degree} in ${edu.field}
  ${edu.institution} (${edu.startYear} - ${edu.endYear})
  ${edu.honors ? 'Honors: ' + edu.honors : ''}
`).join('\n')}

CERTIFICATIONS & CREDENTIALS:
---------------------------------------------------------------
${profile.certifications.map(c => `* ${c.name} - ${c.issuer} (${c.issueDate})${c.credentialId ? ' [ID: ' + c.credentialId + ']' : ''}`).join('\n')}

CORE COMPETENCIES:
---------------------------------------------------------------
${profile.skillCategories.map(sc => `* ${sc.category}: ${sc.skills.join(', ')}`).join('\n')}
`;
    triggerDownload(text, filename, 'text/plain;charset=utf-8');
  };

  const handleDownloadJSON = () => {
    const safeName = (profile.fullName || 'RWEMERA_Ally_Hamis').replace(/\s+/g, '_');
    const filename = `${safeName}_Portfolio_Data.json`;
    const jsonStr = JSON.stringify(profile, null, 2);
    triggerDownload(jsonStr, filename, 'application/json;charset=utf-8');
  };

  const handleSafePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Print preview blocked in iframe sandbox, downloading HTML document:', e);
      handleDownloadHTML();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition mr-2 flex items-center gap-1"
              >
                ← Back to Dashboard
              </button>
            )}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/30">
              Master Professional Profile
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center gap-1" title="CV & certificates are strictly isolated and private to your account">
              🔒 Private to your login
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2.5">
            <FileText className="text-[#7C5CFC]" size={26} />
            Curriculum Vitae & Career History
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Your comprehensive master CV with complete work history, certifications, and AI tailoring for job applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher */}
          <div className="bg-[#0B1020] p-1 rounded-xl border border-[#1E293B] flex items-center text-xs">
            <button
              onClick={() => setActiveTab('master')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'master' ? 'bg-[#7C5CFC] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Master CV
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'credentials' ? 'bg-[#7C5CFC] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Award size={14} className="text-[#FBBF24]" />
              Verified Credentials ({profile.certifications.length})
            </button>
            <button
              onClick={() => setActiveTab('tailor')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'tailor' ? 'bg-[#7C5CFC] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Sparkles size={14} className="text-[#FBBF24]" />
              AI Job Tailor
            </button>
            <button
              onClick={() => setActiveTab('print')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'print' ? 'bg-[#7C5CFC] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Printer size={14} />
              Export / Print
            </button>
          </div>

          <button
            onClick={handleDownloadHTML}
            className="px-3.5 py-2 bg-[#7C5CFC]/20 hover:bg-[#7C5CFC]/30 text-[#A78BFA] border border-[#7C5CFC]/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Download printable official CV document file immediately"
          >
            <Download size={14} className="text-[#A78BFA]" />
            <span>Download CV</span>
          </button>

          <button
            onClick={handleSyncUploadedCertificates}
            disabled={isSaving}
            className="px-3 py-2 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#FBBF24] border border-[#F59E0B]/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            title="Sync all 17 uploaded certificates & credentials directly to this profile"
          >
            <RotateCcw size={13} className={isSaving ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Sync 17 Certificates</span>
            <span className="sm:hidden">Sync 17</span>
          </button>

          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#10B981]/20 transition disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <Check size={15} /> Saved!
              </>
            ) : (
              <>
                <Save size={15} /> Save Master CV
              </>
            )}
          </button>
        </div>
      </div>

      {/* MASTER CV TAB */}
      {activeTab === 'master' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Personal Info & Skills & Certifications */}
          <div className="space-y-6">
            {/* Contact & Basics Card */}
            <div className="bg-[#121A2E] p-5 rounded-2xl border border-[#1E293B]">
              <h2 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Mail size={16} className="text-[#7C5CFC]" /> Contact & Overview
              </h2>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[#94A3B8] block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1">Professional Title</label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={e => setProfile({ ...profile, title: e.target.value })}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#94A3B8] block mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })}
                      className="w-full bg-[#18223A] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#94A3B8] block mb-1">Phone</label>
                    <input
                      type="text"
                      value={profile.phone || ''}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full bg-[#18223A] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1">Location (City, Country)</label>
                  <input
                    type="text"
                    value={profile.location || ''}
                    onChange={e => setProfile({ ...profile, location: e.target.value })}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    value={profile.linkedin || ''}
                    onChange={e => setProfile({ ...profile, linkedin: e.target.value })}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1">GitHub / Portfolio</label>
                  <input
                    type="text"
                    value={profile.github || ''}
                    onChange={e => setProfile({ ...profile, github: e.target.value })}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1">Executive Summary</label>
                  <textarea
                    rows={4}
                    value={profile.summary}
                    onChange={e => setProfile({ ...profile, summary: e.target.value })}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-lg p-3 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Certifications Section */}
            <div className="bg-[#121A2E] p-5 rounded-2xl border border-[#1E293B]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                  <Award size={16} className="text-[#FBBF24]" /> Certifications ({profile.certifications.length})
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('credentials')}
                    className="text-xs text-[#FBBF24] hover:text-[#FDE047] font-medium transition flex items-center gap-1 mr-2"
                  >
                    View Archive ({profile.certifications.length}) →
                  </button>
                  <button
                    onClick={handleAddCertification}
                    className="text-xs bg-[#7C5CFC]/20 text-[#7C5CFC] hover:bg-[#7C5CFC]/30 border border-[#7C5CFC]/30 px-2 py-1 rounded-lg flex items-center gap-1 transition"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {profile.certifications.slice(0, 6).map(cert => (
                  <div key={cert.id} className="bg-[#18223A] p-3 rounded-xl border border-[#1E293B] relative group text-xs">
                    <button
                      onClick={() => handleRemoveCertification(cert.id)}
                      className="absolute top-2.5 right-2.5 text-[#94A3B8] hover:text-[#FB7185] transition"
                      title="Remove certification"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    {cert.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7C5CFC]/15 text-[#A78BFA] border border-[#7C5CFC]/25 mb-1 inline-block">
                        {cert.category}
                      </span>
                    )}

                    <input
                      type="text"
                      value={cert.name}
                      onChange={e => {
                        const val = e.target.value;
                        setProfile(prev => ({
                          ...prev,
                          certifications: prev.certifications.map(c => c.id === cert.id ? { ...c, name: val } : c)
                        }));
                      }}
                      className="font-semibold text-[#F8FAFC] bg-transparent border-b border-transparent hover:border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none w-[85%] block mb-1"
                      placeholder="Certification Title"
                    />

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={e => {
                          const val = e.target.value;
                          setProfile(prev => ({
                            ...prev,
                            certifications: prev.certifications.map(c => c.id === cert.id ? { ...c, issuer: val } : c)
                          }));
                        }}
                        className="text-[#94A3B8] bg-transparent border-b border-transparent hover:border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none"
                        placeholder="Issuer (e.g. Google, AWS)"
                      />
                      <input
                        type="text"
                        value={cert.issueDate}
                        onChange={e => {
                          const val = e.target.value;
                          setProfile(prev => ({
                            ...prev,
                            certifications: prev.certifications.map(c => c.id === cert.id ? { ...c, issueDate: val } : c)
                          }));
                        }}
                        className="text-[#94A3B8] text-right bg-transparent border-b border-transparent hover:border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none"
                        placeholder="Year / Date"
                      />
                    </div>

                    {(cert.credentialId || cert.credentialUrl) && (
                      <div className="mt-2 pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-[11px] text-[#94A3B8]">
                        <span className="truncate max-w-[170px]" title={cert.credentialId}>
                          ID: {cert.credentialId || 'Verified'}
                        </span>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#38BDF8] hover:text-[#7DD3FC] flex items-center gap-1 transition"
                          >
                            Verify <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {profile.certifications.length > 6 && (
                  <button
                    onClick={() => setActiveTab('credentials')}
                    className="w-full py-2 bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] rounded-xl text-center text-xs text-[#FBBF24] font-medium transition"
                  >
                    + View all {profile.certifications.length} verified credentials in full archive →
                  </button>
                )}
              </div>
            </div>

            {/* Skills Categories */}
            <div className="bg-[#121A2E] p-5 rounded-2xl border border-[#1E293B]">
              <h2 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Code size={16} className="text-[#38BDF8]" /> Core Competencies & Skills
              </h2>

              <div className="space-y-4">
                {profile.skillCategories.map((cat, catIdx) => (
                  <div key={catIdx} className="bg-[#18223A] p-3 rounded-xl border border-[#1E293B]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#22D3EE]">{cat.category}</span>
                      <button
                        onClick={() => handleRemoveCategory(catIdx)}
                        className="text-[#94A3B8] hover:text-[#FB7185] transition"
                        title="Delete category"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {cat.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="bg-[#0B1020] text-[#F8FAFC] text-[11px] px-2 py-0.5 rounded-md border border-[#1E293B] flex items-center gap-1 group"
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(catIdx, skill)}
                            className="text-[#94A3B8] hover:text-[#FB7185] transition"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add skill input */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="text"
                        placeholder="Add skill..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleAddSkillToCategory(catIdx, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="flex-1 bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}

                {/* Add new category */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B]">
                  <input
                    type="text"
                    value={newSkillCat}
                    onChange={e => setNewSkillCat(e.target.value)}
                    placeholder="New category (e.g. DevOps)..."
                    className="flex-1 bg-[#18223A] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="text-xs bg-[#7C5CFC]/20 text-[#7C5CFC] hover:bg-[#7C5CFC]/30 border border-[#7C5CFC]/30 px-3 py-1.5 rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Two Columns: Experience, Education, Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experience Section */}
            <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Briefcase size={18} className="text-[#7C5CFC]" /> Work Experience & History
                  </h2>
                  <p className="text-xs text-[#94A3B8]">Full career timeline preserved in master record</p>
                </div>
                <button
                  onClick={handleAddExperience}
                  className="px-3 py-1.5 bg-[#7C5CFC]/20 hover:bg-[#7C5CFC]/30 text-[#7C5CFC] border border-[#7C5CFC]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus size={14} /> Add Role
                </button>
              </div>

              <div className="space-y-4">
                {profile.experiences.map(exp => (
                  <div key={exp.id} className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B] space-y-3 relative group">
                    <button
                      onClick={() => handleRemoveExperience(exp.id)}
                      className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#FB7185] transition"
                      title="Remove role"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div>
                        <label className="text-[11px] text-[#94A3B8] block">Role Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={e => {
                            const val = e.target.value;
                            setProfile(prev => ({
                              ...prev,
                              experiences: prev.experiences.map(x => x.id === exp.id ? { ...x, role: val } : x)
                            }));
                          }}
                          className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] font-semibold focus:border-[#7C5CFC] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#94A3B8] block">Company / Organization</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={e => {
                            const val = e.target.value;
                            setProfile(prev => ({
                              ...prev,
                              experiences: prev.experiences.map(x => x.id === exp.id ? { ...x, company: val } : x)
                            }));
                          }}
                          className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-[#94A3B8] block">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={e => {
                            const val = e.target.value;
                            setProfile(prev => ({
                              ...prev,
                              experiences: prev.experiences.map(x => x.id === exp.id ? { ...x, startDate: val } : x)
                            }));
                          }}
                          className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                          placeholder="e.g. 2022"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#94A3B8] block">End Date</label>
                        <input
                          type="text"
                          value={exp.endDate || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setProfile(prev => ({
                              ...prev,
                              experiences: prev.experiences.map(x => x.id === exp.id ? { ...x, endDate: val } : x)
                            }));
                          }}
                          className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                          placeholder="e.g. Present"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#94A3B8] block">Location</label>
                        <input
                          type="text"
                          value={exp.location || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setProfile(prev => ({
                              ...prev,
                              experiences: prev.experiences.map(x => x.id === exp.id ? { ...x, location: val } : x)
                            }));
                          }}
                          className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                          placeholder="City / Remote"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-[#94A3B8] block mb-1">Responsibilities & Impact</label>
                      <textarea
                        rows={2}
                        value={exp.description}
                        onChange={e => {
                          const val = e.target.value;
                          setProfile(prev => ({
                            ...prev,
                            experiences: prev.experiences.map(x => x.id === exp.id ? { ...x, description: val } : x)
                          }));
                        }}
                        className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg p-2 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none resize-none"
                      />
                    </div>

                    {/* Achievements List */}
                    <div>
                      <label className="text-[11px] text-[#94A3B8] block mb-1">Key Achievements (Bullet Points)</label>
                      <div className="space-y-1.5">
                        {(exp.achievements || []).map((ach, aIdx) => (
                          <div key={aIdx} className="flex items-center gap-2">
                            <span className="text-[#7C5CFC] text-sm">•</span>
                            <input
                              type="text"
                              value={ach}
                              onChange={e => {
                                const val = e.target.value;
                                setProfile(prev => ({
                                  ...prev,
                                  experiences: prev.experiences.map(x => {
                                    if (x.id !== exp.id) return x;
                                    const achs = [...(x.achievements || [])];
                                    achs[aIdx] = val;
                                    return { ...x, achievements: achs };
                                  })
                                }));
                              }}
                              className="flex-1 bg-[#0B1020] border border-[#1E293B] rounded-md px-2 py-1 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                setProfile(prev => ({
                                  ...prev,
                                  experiences: prev.experiences.map(x => {
                                    if (x.id !== exp.id) return x;
                                    return { ...x, achievements: (x.achievements || []).filter((_, i) => i !== aIdx) };
                                  })
                                }));
                              }}
                              className="text-[#94A3B8] hover:text-[#FB7185] text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setProfile(prev => ({
                            ...prev,
                            experiences: prev.experiences.map(x => {
                              if (x.id !== exp.id) return x;
                              return { ...x, achievements: [...(x.achievements || []), 'Delivered measurable outcome...'] };
                            })
                          }));
                        }}
                        className="text-[11px] text-[#7C5CFC] hover:text-[#A78BFA] mt-2 flex items-center gap-1"
                      >
                        + Add achievement bullet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education Section */}
            <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                  <GraduationCap size={18} className="text-[#34D399]" /> Education
                </h2>
                <button
                  onClick={handleAddEducation}
                  className="px-3 py-1.5 bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#34D399] border border-[#34D399]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus size={14} /> Add Degree
                </button>
              </div>

              <div className="space-y-3">
                {profile.education.map(edu => (
                  <div key={edu.id} className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B] relative group space-y-2 text-xs">
                    <button
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="absolute top-3 right-3 text-[#94A3B8] hover:text-[#FB7185] transition"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={e => {
                          const val = e.target.value;
                          setProfile(prev => ({
                            ...prev,
                            education: prev.education.map(x => x.id === edu.id ? { ...x, degree: val } : x)
                          }));
                        }}
                        className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] font-semibold focus:border-[#7C5CFC] focus:outline-none"
                        placeholder="Degree (e.g. Bachelor of Science)"
                      />
                      <input
                        type="text"
                        value={edu.field}
                        onChange={e => {
                          const val = e.target.value;
                          setProfile(prev => ({
                            ...prev,
                            education: prev.education.map(x => x.id === edu.id ? { ...x, field: val } : x)
                          }));
                        }}
                        className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                        placeholder="Major / Field of Study"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={e => {
                          const val = e.target.value;
                          setProfile(prev => ({
                            ...prev,
                            education: prev.education.map(x => x.id === edu.id ? { ...x, institution: val } : x)
                          }));
                        }}
                        className="col-span-2 bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs text-[#94A3B8] focus:border-[#7C5CFC] focus:outline-none"
                        placeholder="Institution / University Name"
                      />
                      <input
                        type="text"
                        value={`${edu.startYear} - ${edu.endYear}`}
                        onChange={e => {
                          const parts = e.target.value.split('-');
                          setProfile(prev => ({
                            ...prev,
                            education: prev.education.map(x => x.id === edu.id ? { 
                              ...x, 
                              startYear: parts[0]?.trim() || '', 
                              endYear: parts[1]?.trim() || '' 
                            } : x)
                          }));
                        }}
                        className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs text-[#94A3B8] text-right focus:border-[#7C5CFC] focus:outline-none"
                        placeholder="Years (2019 - 2023)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Projects & Portfolio Section */}
            <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                  <FolderGit2 size={18} className="text-[#38BDF8]" /> Key Portfolio Projects
                </h2>
                <button
                  onClick={handleAddProject}
                  className="px-3 py-1.5 bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 text-[#38BDF8] border border-[#38BDF8]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>

              <div className="space-y-3">
                {profile.projects.map(proj => (
                  <div key={proj.id} className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B] relative group space-y-2 text-xs">
                    <button
                      onClick={() => handleRemoveProject(proj.id)}
                      className="absolute top-3 right-3 text-[#94A3B8] hover:text-[#FB7185] transition"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                      <input
                        type="text"
                        value={proj.title}
                        onChange={e => {
                          const val = e.target.value;
                          setProfile(prev => ({
                            ...prev,
                            projects: prev.projects.map(x => x.id === proj.id ? { ...x, title: val } : x)
                          }));
                        }}
                        className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] font-semibold focus:border-[#7C5CFC] focus:outline-none"
                        placeholder="Project Title"
                      />
                      <input
                        type="text"
                        value={proj.url || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setProfile(prev => ({
                            ...prev,
                            projects: prev.projects.map(x => x.id === proj.id ? { ...x, url: val } : x)
                          }));
                        }}
                        className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-[#38BDF8] focus:border-[#7C5CFC] focus:outline-none"
                        placeholder="https://github.com/..."
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={e => {
                        const val = e.target.value;
                        setProfile(prev => ({
                          ...prev,
                          projects: prev.projects.map(x => x.id === proj.id ? { ...x, description: val } : x)
                        }));
                      }}
                      className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg p-2 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none resize-none"
                      placeholder="Project description, architecture, and impact..."
                    />

                    <input
                      type="text"
                      value={proj.techStack.join(', ')}
                      onChange={e => {
                        const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setProfile(prev => ({
                          ...prev,
                          projects: prev.projects.map(x => x.id === proj.id ? { ...x, techStack: val } : x)
                        }));
                      }}
                      className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs text-[#94A3B8] focus:border-[#7C5CFC] focus:outline-none"
                      placeholder="Tech Stack (comma-separated: React, TypeScript, Cloud...)"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERIFIED CREDENTIALS ARCHIVE TAB */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30 flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified Documents Registry
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    {profile.certifications.length} Registered Accreditations
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
                  <Award className="text-[#FBBF24]" size={22} />
                  Master Credentials & Diplomas Archive
                </h2>
                <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed">
                  Verified certificates, United Nations peace operations training, international cognitive assessments, national examination diplomas, and civil records for <strong className="text-[#F8FAFC]">RWEMERA Ally Hamis</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSyncUploadedCertificates}
                  disabled={isSaving}
                  className="px-3.5 py-2 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#FBBF24] border border-[#F59E0B]/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                  title="Reset & synchronize all 17 verified certificates from source"
                >
                  <RotateCcw size={13} className={isSaving ? 'animate-spin' : ''} />
                  <span>Sync 17 Certificates</span>
                </button>
                <button
                  onClick={handleAddCertification}
                  className="px-3.5 py-2 bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#7C5CFC]/20 transition"
                >
                  <Plus size={14} /> Add New Certificate
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1E293B]">
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#1E293B]">
                <div className="text-[11px] text-[#94A3B8]">Peace Operations</div>
                <div className="text-base font-bold text-[#38BDF8]">4 Accreditations</div>
                <div className="text-[10px] text-[#64748B]">POTI, UNMAS, UNESCO, Kaya</div>
              </div>
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#1E293B]">
                <div className="text-[11px] text-[#94A3B8]">High Performance & Strengths</div>
                <div className="text-base font-bold text-[#FBBF24]">100% CSM & Gallup</div>
                <div className="text-[10px] text-[#64748B]">SeeMore Impact Labs & Gallup</div>
              </div>
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#1E293B]">
                <div className="text-[11px] text-[#94A3B8]">Language & Debate</div>
                <div className="text-base font-bold text-[#34D399]">C2 & 9th Speaker</div>
                <div className="text-[10px] text-[#64748B]">EF SET (100% Writing) & iDebate</div>
              </div>
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#1E293B]">
                <div className="text-[11px] text-[#94A3B8]">National Honors</div>
                <div className="text-base font-bold text-[#A78BFA]">60/60 MEG Distinction</div>
                <div className="text-[10px] text-[#64748B]">NESA National Exam & UR Social Work</div>
              </div>
            </div>

            {/* Search and Category Filter */}
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={credSearch}
                  onChange={e => setCredSearch(e.target.value)}
                  placeholder="Search certificates, issuers, ID codes, topics..."
                  className="w-full bg-[#0B1020] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none placeholder-[#64748B]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {['All', 'Peace Operations', 'High Performance', 'Language & Debate', 'Business & Digital'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCredCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg transition text-[11px] font-medium ${
                      credCategory === cat 
                        ? 'bg-[#7C5CFC] text-white' 
                        : 'bg-[#0B1020] text-[#94A3B8] hover:text-white border border-[#1E293B]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Certificates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.certifications
              .filter(cert => {
                const q = credSearch.toLowerCase();
                const matchesSearch = !credSearch || 
                  cert.name.toLowerCase().includes(q) ||
                  cert.issuer.toLowerCase().includes(q) ||
                  (cert.credentialId && cert.credentialId.toLowerCase().includes(q)) ||
                  (cert.notes && cert.notes.toLowerCase().includes(q));

                if (!matchesSearch) return false;
                if (credCategory === 'All') return true;
                if (credCategory === 'Peace Operations') {
                  return cert.category?.includes('Peace Operations') || cert.issuer.includes('POTI') || cert.issuer.includes('UNMAS') || cert.issuer.includes('Kaya');
                }
                if (credCategory === 'High Performance') {
                  return cert.category?.includes('High Performance') || cert.issuer.includes('SeeMore') || cert.issuer.includes('Gallup');
                }
                if (credCategory === 'Language & Debate') {
                  return cert.category?.includes('Language') || cert.category?.includes('Debate') || cert.issuer.includes('EF') || cert.issuer.includes('Debate');
                }
                if (credCategory === 'Business & Digital') {
                  return cert.category?.includes('Business') || cert.issuer.includes('atingi') || cert.issuer.includes('Ingazi');
                }
                return true;
              })
              .map(cert => (
                <div
                  key={cert.id}
                  className="bg-[#121A2E] p-5 rounded-2xl border border-[#1E293B] hover:border-[#7C5CFC]/40 transition shadow-lg flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#7C5CFC]/15 text-[#A78BFA] border border-[#7C5CFC]/25">
                        {cert.category || 'Professional Credential'}
                      </span>
                      {cert.score && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/25">
                          {cert.score}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#F8FAFC] leading-snug group-hover:text-[#A78BFA] transition">
                      {cert.name}
                    </h3>

                    <div className="text-xs text-[#94A3B8] font-medium flex items-center gap-1.5">
                      <Building size={13} className="text-[#38BDF8]" />
                      <span>{cert.issuer}</span>
                    </div>

                    <div className="text-[11px] text-[#64748B] flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Issued: {cert.issueDate}
                      </span>
                    </div>

                    {cert.notes && (
                      <p className="text-[11px] text-[#94A3B8] bg-[#0B1020]/60 p-2 rounded-lg border border-[#1E293B]/60 leading-relaxed">
                        {cert.notes}
                      </p>
                    )}
                  </div>

                  {/* Footer with Serial Code & Verification Link */}
                  <div className="pt-3 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs">
                    {cert.credentialId ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                        <span className="font-mono bg-[#0B1020] px-2 py-0.5 rounded border border-[#1E293B]">
                          {cert.credentialId}
                        </span>
                        <button
                          onClick={() => {
                            if (cert.credentialId) {
                              navigator.clipboard.writeText(cert.credentialId);
                              setCopiedId(cert.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }
                          }}
                          className="text-[#94A3B8] hover:text-white p-1 transition"
                          title="Copy Credential ID"
                        >
                          {copiedId === cert.id ? <Check size={13} className="text-[#10B981]" /> : <Copy size={13} />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#64748B]">Official Accredited Record</span>
                    )}

                    <div className="flex items-center gap-2">
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] border border-[#38BDF8]/30 rounded-lg font-medium text-[11px] flex items-center gap-1 transition"
                        >
                          Verify Official Record <ExternalLink size={11} />
                        </a>
                      )}
                      <button
                        onClick={() => handleRemoveCertification(cert.id)}
                        className="text-[#64748B] hover:text-[#FB7185] p-1 transition"
                        title="Remove certification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Academic Degrees & National Examination Results */}
          <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] space-y-4">
            <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <GraduationCap className="text-[#34D399]" size={20} />
              Formal Academic Degrees & National Examination Results
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/25">
                    University Degree (Current)
                  </span>
                  <span className="text-xs font-mono text-[#94A3B8]">2023 – 2027</span>
                </div>
                <h4 className="text-sm font-bold text-[#F8FAFC]">
                  Bachelor of Social Sciences (Honours) in Social Work (BH8SOW)
                </h4>
                <p className="text-xs text-[#38BDF8]">
                  University of Rwanda (UR) — College of Arts and Social Sciences (CASS), Huye Campus
                </p>
                <div className="text-[11px] text-[#94A3B8] space-y-1 pt-1">
                  <div>• Student Registration Number: <strong className="text-[#F8FAFC] font-mono">223020280</strong></div>
                  <div>• Mode: Full-Time Regular Scholar</div>
                  <div>• Field of Study: Social Work, Social Policy, Human Vulnerability, and Community Systems</div>
                </div>
              </div>

              <div className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/25">
                    National Examination Distinction
                  </span>
                  <span className="text-xs font-mono text-[#94A3B8]">2022 (A2)</span>
                </div>
                <h4 className="text-sm font-bold text-[#F8FAFC]">
                  Advanced Level Secondary School Certificate (Option: MEG)
                </h4>
                <p className="text-xs text-[#38BDF8]">
                  Rusumo High School & National Examination and School Inspection Authority (NESA)
                </p>
                <div className="text-[11px] text-[#94A3B8] space-y-1 pt-1">
                  <div>• Maximum Weighted Aggregate Score: <strong className="text-[#FBBF24] font-bold">60 / 60</strong> (Top Tier)</div>
                  <div>• Subject Grades: Literature in English (<strong className="text-[#34D399]">A</strong>), Economics (<strong className="text-[#34D399]">A</strong>), Entrepreneurship (<strong className="text-[#34D399]">A</strong>), Geography (<strong className="text-[#34D399]">A</strong>), General Studies (<strong className="text-[#34D399]">S</strong>)</div>
                  <div>• Examination Index: <span className="font-mono text-[#F8FAFC]">550404LEG0202022</span> | Ref: <span className="font-mono text-[#F8FAFC]">S6/023473/NESA/12/2022</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Verified Civil Records & Legal Identity */}
          <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                  <ShieldCheck className="text-[#38BDF8]" size={20} />
                  Official Civil Identity & Legal Records
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Civil registrar verifications, National ID, and character certifications of the Republic of Rwanda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#18223A] p-3.5 rounded-xl border border-[#1E293B] space-y-1.5">
                <span className="text-[10px] text-[#38BDF8] font-semibold uppercase">National ID (Indangamuntu)</span>
                <div className="font-mono text-[#F8FAFC] font-bold text-xs">1 2002 8 0172601 1 53</div>
                <div className="text-[11px] text-[#94A3B8]">DOB: 01/01/2002</div>
                <div className="text-[11px] text-[#64748B]">Place: Kirehe / Nyarubuye</div>
              </div>

              <div className="bg-[#18223A] p-3.5 rounded-xl border border-[#1E293B] space-y-1.5">
                <span className="text-[10px] text-[#34D399] font-semibold uppercase">Birth Certificate (Irembo)</span>
                <div className="font-mono text-[#F8FAFC] font-bold text-xs">B240207194534CGUT</div>
                <div className="text-[11px] text-[#94A3B8]">Father: Rwemera Iddi</div>
                <div className="text-[11px] text-[#94A3B8]">Mother: Murebwayire Aisha</div>
                <div className="text-[11px] text-[#64748B]">Origin: Ngoma, Rwanda</div>
              </div>

              <div className="bg-[#18223A] p-3.5 rounded-xl border border-[#1E293B] space-y-1.5">
                <span className="text-[10px] text-[#A78BFA] font-semibold uppercase">Criminal Record (NPPA)</span>
                <div className="font-mono text-[#F8FAFC] font-bold text-xs">DCJ/ECJ/070680/2023</div>
                <div className="text-[11px] text-[#10B981] font-semibold">Clean Judicial Record</div>
                <div className="text-[11px] text-[#64748B]">Zero Criminal Convictions</div>
              </div>

              <div className="bg-[#18223A] p-3.5 rounded-xl border border-[#1E293B] space-y-1.5">
                <span className="text-[10px] text-[#FBBF24] font-semibold uppercase">Celibacy / Single Status</span>
                <div className="font-mono text-[#F8FAFC] font-bold text-xs">B230210105018B6IS</div>
                <div className="text-[11px] text-[#94A3B8]">Status: Ingaragu (Single)</div>
                <div className="text-[11px] text-[#64748B]">Gasabo / Kacyiru Sector</div>
              </div>
            </div>
          </div>

          {/* Incoming & Scattered Certificates Tracker */}
          <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                  <FileCheck className="text-[#FBBF24]" size={20} />
                  Incoming & Scattered Certificates Staging Tracker
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Keep track of additional scattered certificates, workshop letters, or diplomas as you locate them.
                </p>
              </div>
            </div>

            <div className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#94A3B8] block mb-1">Certificate Title / Document Name</label>
                  <input
                    type="text"
                    value={scatterTitle}
                    onChange={e => setScatterTitle(e.target.value)}
                    placeholder="e.g. Leadership Workshop Certificate"
                    className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#94A3B8] block mb-1">Issuing Institution / Organization</label>
                  <input
                    type="text"
                    value={scatterIssuer}
                    onChange={e => setScatterIssuer(e.target.value)}
                    placeholder="e.g. Youth Initiative / School"
                    className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#94A3B8] block mb-1">Estimated Year / Date</label>
                  <input
                    type="text"
                    value={scatterYear}
                    onChange={e => setScatterYear(e.target.value)}
                    placeholder="e.g. 2020 or 2021"
                    className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#94A3B8] block mb-1">Where is it scattered? / Notes to locate it</label>
                <input
                  type="text"
                  value={scatterNotes}
                  onChange={e => setScatterNotes(e.target.value)}
                  placeholder="e.g. Physical hardcopy at home in Ngoma, or in high school archive folder..."
                  className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    if (!scatterTitle.trim()) return;
                    const newCert: CVCertification = {
                      id: 'scattered-' + Date.now(),
                      name: scatterTitle.trim(),
                      issuer: scatterIssuer.trim() || 'Institution (Pending Archive)',
                      issueDate: scatterYear.trim() || new Date().getFullYear().toString(),
                      category: 'Incoming / Scattered Record',
                      score: 'Pending Retrieval',
                      notes: scatterNotes.trim() || 'Scattered document being gathered by candidate.'
                    };
                    setProfile(prev => ({
                      ...prev,
                      certifications: [newCert, ...prev.certifications]
                    }));
                    setScatterTitle('');
                    setScatterIssuer('');
                    setScatterYear('');
                    setScatterNotes('');
                    handleSaveProfile();
                  }}
                  disabled={!scatterTitle.trim()}
                  className="px-4 py-2 bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-40"
                >
                  <Plus size={14} /> Add to My Certificate Registry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI JOB TAILOR TAB */}
      {activeTab === 'tailor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Inputs */}
          <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F8FAFC]">AI Resume & CV Tailor</h2>
                <p className="text-xs text-[#94A3B8]">
                  Tailors your master CV to any specific job description while keeping your master record intact.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#94A3B8] block mb-1 font-medium">Target Job Title *</label>
                <input
                  type="text"
                  value={tailorJobTitle}
                  onChange={e => setTailorJobTitle(e.target.value)}
                  placeholder="e.g. Lead Full-Stack Architect / Senior Platform Engineer"
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2.5 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1 font-medium">Target Company (Optional)</label>
                <input
                  type="text"
                  value={tailorCompany}
                  onChange={e => setTailorCompany(e.target.value)}
                  placeholder="e.g. Stripe, Google, Andela, or Bank of Kigali"
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2.5 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1 font-medium">Target Tone</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['impact-driven', 'technical', 'executive'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTailorTone(t)}
                      className={`py-2 px-3 rounded-lg border text-xs capitalize transition ${
                        tailorTone === t 
                          ? 'bg-[#7C5CFC]/20 border-[#7C5CFC] text-[#7C5CFC] font-semibold' 
                          : 'bg-[#18223A] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1 font-medium">Job Description / Requirements *</label>
                <textarea
                  rows={8}
                  value={tailorJobDesc}
                  onChange={e => setTailorJobDesc(e.target.value)}
                  placeholder="Paste the job description, required qualifications, key technologies, or candidate responsibilities here..."
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl p-3 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleGenerateTailoredCV}
                disabled={isTailoring || (!tailorJobTitle && !tailorJobDesc)}
                className="w-full py-3 bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#7C5CFC]/20 transition disabled:opacity-50"
              >
                {isTailoring ? (
                  <>
                    <Sparkles className="animate-spin" size={16} />
                    Analyzing Master CV & Tailoring...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Tailored Resume & Fit Strategy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tailored Results Preview */}
          <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                <FileText size={18} className="text-[#10B981]" /> Tailored Output
              </h2>
              {tailoredResult && (
                <button
                  onClick={copyTailoredText}
                  className="px-3 py-1.5 bg-[#18223A] hover:bg-[#1E293B] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-lg flex items-center gap-1.5 transition"
                >
                  {copied ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Formatted Text'}
                </button>
              )}
            </div>

            {!tailoredResult ? (
              <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-[#1E293B] rounded-xl text-center p-6 text-xs text-[#94A3B8]">
                <Sparkles size={32} className="text-[#7C5CFC] mb-3 opacity-40" />
                <p className="max-w-xs">
                  Fill in the target job details on the left. The AI will cross-examine your certifications, experiences, and skills to highlight your most compelling match points.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 text-xs">
                {/* Fit Score & Strategy */}
                {tailoredResult.fitScoreExplanation && (
                  <div className="bg-[#18223A] p-3.5 rounded-xl border border-[#7C5CFC]/30 bg-gradient-to-br from-[#7C5CFC]/10 to-transparent">
                    <span className="text-[11px] font-bold uppercase text-[#A78BFA] tracking-wide block mb-1">
                      Strategic Fit & Interview Angle
                    </span>
                    <p className="text-[#F8FAFC] leading-relaxed">
                      {tailoredResult.fitScoreExplanation}
                    </p>
                  </div>
                )}

                {/* Tailored Executive Summary */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">
                    Tailored Executive Summary
                  </span>
                  <div className="bg-[#18223A] p-3 rounded-xl border border-[#1E293B] text-[#F8FAFC] leading-relaxed">
                    {tailoredResult.executiveSummary}
                  </div>
                </div>

                {/* Key Match Highlights */}
                {tailoredResult.tailoredHighlights && tailoredResult.tailoredHighlights.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">
                      Target Role Match Points
                    </span>
                    <ul className="bg-[#18223A] p-3 rounded-xl border border-[#1E293B] space-y-1.5 list-disc list-inside text-[#F8FAFC]">
                      {tailoredResult.tailoredHighlights.map((h, i) => (
                        <li key={i} className="leading-relaxed">{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Customized Experiences */}
                {tailoredResult.customizedExperiences && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">
                      Optimized Experience Bullets
                    </span>
                    {tailoredResult.customizedExperiences.map((exp, idx) => (
                      <div key={idx} className="bg-[#18223A] p-3 rounded-xl border border-[#1E293B] space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#F8FAFC]">
                          <span>{exp.role}</span>
                          <span className="text-[#94A3B8] font-normal">{exp.company} ({exp.dates})</span>
                        </div>
                        <ul className="space-y-1 list-disc list-inside text-[#94A3B8] text-[11px]">
                          {exp.bulletPoints.map((bp, bIdx) => (
                            <li key={bIdx} className="text-[#F8FAFC] leading-relaxed">{bp}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Highlighted Certifications & Skills */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide block mb-1">
                      Applicable Certifications
                    </span>
                    <div className="bg-[#18223A] p-2.5 rounded-xl border border-[#1E293B] text-[11px] text-[#FBBF24] space-y-1">
                      {tailoredResult.certifications?.length > 0 
                        ? tailoredResult.certifications.map((c, i) => <div key={i}>✓ {c}</div>)
                        : <span className="text-[#94A3B8]">All certifications relevant</span>
                      }
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide block mb-1">
                      Priority Aligned Skills
                    </span>
                    <div className="bg-[#18223A] p-2.5 rounded-xl border border-[#1E293B] text-[11px] flex flex-wrap gap-1">
                      {tailoredResult.keySkills?.map((s, i) => (
                        <span key={i} className="bg-[#0B1020] px-1.5 py-0.5 rounded text-[#22D3EE] border border-[#1E293B]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINT / EXPORT PREVIEW TAB */}
      {activeTab === 'print' && (
        <div className="space-y-4">
          <div className="bg-[#121A2E] p-4 rounded-2xl border border-[#1E293B] flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                <Download size={16} className="text-[#7C5CFC]" />
                Export & Download Options
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Download your official verified CV in multiple industry formats or print to PDF with zero restrictions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadHTML}
                className="px-3.5 py-2 bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#7C5CFC]/20 transition cursor-pointer"
                title="Download self-contained HTML document ready to open and save as PDF"
              >
                <Download size={14} /> Download HTML / PDF
              </button>

              <button
                onClick={handleDownloadWordDoc}
                className="px-3.5 py-2 bg-[#18223A] hover:bg-[#1E293B] text-[#38BDF8] border border-[#38BDF8]/40 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                title="Download formatted Microsoft Word document (.doc)"
              >
                <FileText size={14} /> Download Word (.doc)
              </button>

              <button
                onClick={handleDownloadPlainText}
                className="px-3 py-2 bg-[#18223A] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E293B] font-medium text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                title="Download ATS-optimized plain text resume"
              >
                <Copy size={14} /> ATS Text (.txt)
              </button>

              <button
                onClick={handleDownloadJSON}
                className="px-3 py-2 bg-[#18223A] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E293B] font-medium text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                title="Download complete JSON data file"
              >
                <Save size={14} /> JSON Data
              </button>

              <button
                onClick={handleSafePrint}
                className="px-3.5 py-2 bg-[#18223A] hover:bg-[#1E293B] text-[#FBBF24] border border-[#FBBF24]/40 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                title="Open browser print dialogue or fallback to file download"
              >
                <Printer size={14} /> Print Dialog
              </button>
            </div>
          </div>

          <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl max-w-4xl mx-auto print:shadow-none print:p-0 font-sans">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                {profile.fullName}
              </h1>
              <p className="text-base font-semibold text-indigo-700 mt-0.5">
                {profile.title}
              </p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2 font-mono">
                {profile.email && <span>{profile.email}</span>}
                {profile.phone && <span>• {profile.phone}</span>}
                {profile.location && <span>• {profile.location}</span>}
                {profile.linkedin && <span>• {profile.linkedin.replace('https://', '')}</span>}
                {profile.github && <span>• {profile.github.replace('https://', '')}</span>}
              </div>
            </div>

            {/* Summary */}
            {profile.summary && (
              <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Executive Profile
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {profile.summary}
                </p>
              </div>
            )}

            {/* Work Experience */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-1">
                Professional Experience
              </h2>
              <div className="space-y-4">
                {profile.experiences.map(exp => (
                  <div key={exp.id} className="text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{exp.role} — <span className="text-indigo-800 font-semibold">{exp.company}</span></span>
                      <span className="text-slate-500 font-mono text-[11px]">{exp.startDate} – {exp.endDate || 'Present'}</span>
                    </div>
                    {exp.description && (
                      <p className="text-slate-700 mt-1 leading-relaxed">{exp.description}</p>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-slate-700">
                        {exp.achievements.map((ach, aIdx) => (
                          <li key={aIdx} className="leading-relaxed">{ach}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications & Education in Two Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Education */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                  Education
                </h2>
                <div className="space-y-2.5">
                  {profile.education.map(edu => (
                    <div key={edu.id} className="text-xs">
                      <div className="font-bold text-slate-900">{edu.degree} in {edu.field}</div>
                      <div className="text-slate-600">{edu.institution} ({edu.startYear} – {edu.endYear})</div>
                      {edu.honors && <div className="text-indigo-700 text-[11px] font-semibold">{edu.honors}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                  Certifications & Credentials
                </h2>
                <div className="space-y-2 text-xs">
                  {profile.certifications.map(cert => (
                    <div key={cert.id}>
                      <div className="font-bold text-slate-900">{cert.name}</div>
                      <div className="text-slate-600 text-[11px]">
                        {cert.issuer} • Issued {cert.issueDate} {cert.credentialId ? `(ID: ${cert.credentialId})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                Core Competencies
              </h2>
              <div className="space-y-1 text-xs">
                {profile.skillCategories.map((cat, cIdx) => (
                  <div key={cIdx}>
                    <span className="font-bold text-slate-800">{cat.category}: </span>
                    <span className="text-slate-700">{cat.skills.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

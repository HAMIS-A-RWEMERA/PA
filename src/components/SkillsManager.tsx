import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  BookOpen, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  BarChart2,
  TrendingUp,
  Tag
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { SkillEntry } from '../types';
import { RWEMERA_SKILLS } from '../data/userCertificates';

const MASTER_STRENGTHS = [
  {
    theme: 'Achiever',
    domain: 'Executing',
    desc: 'Has a great deal of stamina and works hard. Possesses immense satisfaction from being busy and productive.',
    source: 'CliftonStrengths / Gallup'
  },
  {
    theme: 'Learner',
    domain: 'Strategic Thinking',
    desc: 'Has a great desire to learn and continuously improve. The process of learning excites rather than just the outcome.',
    source: 'CliftonStrengths / Gallup'
  },
  {
    theme: 'Analytical',
    domain: 'Strategic Thinking',
    desc: 'Searches for reasons and causes. Has the ability to think about all the factors that might affect a situation.',
    source: 'CliftonStrengths / Gallup'
  },
  {
    theme: 'Discipline',
    domain: 'Executing',
    desc: 'Enjoys routine and structure. Creates order, plans with precision, and methodically executes schedules.',
    source: 'CliftonStrengths / Gallup'
  },
  {
    theme: 'Focus',
    domain: 'Executing',
    desc: 'Can take a direction, follow through, and make the corrections necessary to stay on track. Prioritizes then acts.',
    source: 'CliftonStrengths / Gallup'
  }
];

export default function SkillsManager({ onBack }: { onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<'my_skills' | 'strengths_matrix' | 'cv_inventory'>('my_skills');
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form states for adding skill
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('High Performance & Strengths');
  const [level, setLevel] = useState<'Novice' | 'Intermediate' | 'Advanced' | 'Mastery'>('Intermediate');
  const [hoursInvested, setHoursInvested] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firestore real-time listener
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'skills'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as SkillEntry[];
      setSkills(items);
    }, (err) => {
      console.warn('Skills listener error:', err);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'skills'), {
        userId: auth.currentUser.uid,
        name: name.trim(),
        category,
        level,
        hoursInvested: parseFloat(hoursInvested) || 0,
        notes: notes.trim(),
        date: new Date().toISOString().split('T')[0],
        tags: [category.toLowerCase().replace(/\\s+/g, '-')]
      });

      setName('');
      setHoursInvested('');
      setNotes('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to create skill:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'skills', id));
    } catch (err) {
      console.error('Failed to delete skill:', err);
    }
  };

  const filteredSkills = skills.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getLevelBadge = (lvl: string) => {
    switch (lvl) {
      case 'Mastery':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40">Mastery (Mentor)</span>;
      case 'Advanced':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#7C5CFC]/20 text-[#A78BFA] border border-[#7C5CFC]/40">Advanced</span>;
      case 'Intermediate':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40">Intermediate</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#94A3B8]/20 text-[#94A3B8] border border-[#94A3B8]/40">Novice</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition mr-2 flex items-center gap-1 cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            )}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/30">
              Talent Architecture & Mastery Hub
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2.5">
            <Award className="text-[#FBBF24]" size={26} />
            Skills, Strengths & Competencies
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Track your verified CliftonStrengths, UN POTI logistics competencies, language mastery, and active skill practice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#0B1020] p-1 rounded-xl border border-[#1E293B] flex items-center text-xs">
            <button
              onClick={() => setActiveTab('my_skills')}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                activeTab === 'my_skills' ? 'bg-[#7C5CFC] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              My Logged Skills ({skills.length})
            </button>
            <button
              onClick={() => setActiveTab('strengths_matrix')}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                activeTab === 'strengths_matrix' ? 'bg-[#7C5CFC] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              CliftonStrengths Profile
            </button>
            <button
              onClick={() => setActiveTab('cv_inventory')}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                activeTab === 'cv_inventory' ? 'bg-[#7C5CFC] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Verified CV Inventory
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#7C5CFC]/20 transition cursor-pointer"
          >
            <Plus size={14} /> Add Skill
          </button>
        </div>
      </div>

      {/* TAB 1: Logged Skills */}
      {activeTab === 'my_skills' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#121A2E] p-4 rounded-xl border border-[#1E293B]">
              <span className="text-[11px] text-[#94A3B8] block">Total Logged Skills</span>
              <span className="text-xl font-bold text-[#F8FAFC]">{skills.length}</span>
            </div>
            <div className="bg-[#121A2E] p-4 rounded-xl border border-[#1E293B]">
              <span className="text-[11px] text-[#94A3B8] block">Mastery & Advanced</span>
              <span className="text-xl font-bold text-[#FBBF24]">
                {skills.filter(s => s.level === 'Mastery' || s.level === 'Advanced').length}
              </span>
            </div>
            <div className="bg-[#121A2E] p-4 rounded-xl border border-[#1E293B]">
              <span className="text-[11px] text-[#94A3B8] block">Practice Hours Logged</span>
              <span className="text-xl font-bold text-[#34D399]">
                {skills.reduce((acc, s) => acc + (Number(s.hoursInvested) || 0), 0)} hrs
              </span>
            </div>
            <div className="bg-[#121A2E] p-4 rounded-xl border border-[#1E293B]">
              <span className="text-[11px] text-[#94A3B8] block">Core Strengths Domain</span>
              <span className="text-xl font-bold text-[#7C5CFC]">Executing & Strategic</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#121A2E] p-4 rounded-2xl border border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search competencies or notes..."
                className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'Peace Operations & UN', 'High Performance & Strengths', 'Public Speaking & Debate', 'Social Work & Community', 'Language Proficiency', 'Digital Systems & Tech'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#7C5CFC]/20 text-[#A78BFA] border-[#7C5CFC]'
                      : 'bg-[#18223A] text-[#94A3B8] border-[#1E293B] hover:text-[#F8FAFC]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Grid */}
          {filteredSkills.length === 0 ? (
            <div className="bg-[#121A2E] p-12 rounded-2xl border border-[#1E293B] text-center space-y-3">
              <Award className="mx-auto text-[#7C5CFC]/50" size={36} />
              <h3 className="text-base font-semibold text-[#F8FAFC]">No custom skill logs found</h3>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                You can capture new skills using the <strong>Quick Capture Bar</strong> at the top of the dashboard, or click the <strong>Add Skill</strong> button above.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <Plus size={14} /> Log Your First Skill
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map(skill => (
                <div 
                  key={skill.id}
                  className="bg-[#121A2E] p-4 rounded-2xl border border-[#1E293B] hover:border-[#7C5CFC]/40 transition space-y-3 relative group"
                >
                  <button
                    onClick={() => handleDeleteSkill(skill.id)}
                    className="absolute top-3 right-3 text-[#94A3B8] hover:text-[#FB7185] transition opacity-0 group-hover:opacity-100 cursor-pointer p-1"
                    title="Delete skill"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="flex items-center justify-between pr-6">
                    <span className="text-[10px] text-[#A78BFA] font-mono uppercase font-semibold">
                      {skill.category}
                    </span>
                    {getLevelBadge(skill.level)}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">{skill.name}</h3>
                    {skill.notes && (
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed line-clamp-2">
                        {skill.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#1E293B]/60">
                    <div className="flex items-center gap-1 text-[#34D399]">
                      <Clock size={12} />
                      <span>{skill.hoursInvested || 0} hrs practice</span>
                    </div>
                    <span>{skill.date || 'Recent'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CliftonStrengths Talent Profile */}
      {activeTab === 'strengths_matrix' && (
        <div className="space-y-6">
          <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#FBBF24]" size={22} />
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">
                  RWEMERA Ally Hamis — CliftonStrengths Signature Themes
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Verified Gallup talent profile emphasizing ruthless execution and high-order strategic thinking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {MASTER_STRENGTHS.map((s, idx) => (
                <div 
                  key={s.theme}
                  className="bg-[#18223A] p-5 rounded-xl border border-[#1E293B] space-y-2 relative overflow-hidden group hover:border-[#7C5CFC]/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7C5CFC]/20 text-[#A78BFA] border border-[#7C5CFC]/30">
                      Rank #{idx + 1}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#22D3EE]">{s.domain}</span>
                  </div>
                  <h3 className="text-base font-black text-[#F8FAFC]">{s.theme}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{s.desc}</p>
                  <div className="text-[10px] text-[#64748B] pt-2 border-t border-[#1E293B]">
                    Source: {s.source}
                  </div>
                </div>
              ))}

              {/* SeeMore Strengths Mentor Card */}
              <div className="bg-[#18223A] p-5 rounded-xl border border-[#FBBF24]/40 space-y-2 bg-gradient-to-br from-[#18223A] to-[#2B1F0A]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40">
                    Accreditation
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#34D399]">Score: 100%</span>
                </div>
                <h3 className="text-base font-black text-[#F8FAFC]">SeeMore Certified Strengths Mentor (CSM)</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Certified to coach and empower high-performing individuals, identifying natural talents and translating them into sustainable high-performance outcomes.
                </p>
                <div className="text-[10px] text-[#FBBF24] pt-2 border-t border-[#1E293B]">
                  Issued by SeeMore • Honors Graduate
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Verified CV Inventory */}
      {activeTab === 'cv_inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {RWEMERA_SKILLS.map((cat, idx) => (
            <div key={idx} className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                  <Award size={16} className="text-[#7C5CFC]" />
                  {cat.category}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18223A] text-[#94A3B8]">
                  {cat.skills.length} skills
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {cat.skills.map((sk, skIdx) => (
                  <span 
                    key={skIdx}
                    className="text-xs px-3 py-1.5 rounded-xl bg-[#18223A] text-[#F8FAFC] border border-[#1E293B] hover:border-[#7C5CFC]/40 transition"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                <Award size={18} className="text-[#7C5CFC]" />
                Log New Skill or Competency
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSkill} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1 font-medium">Competency / Skill Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. UN Operational Logistics, Public Speaking"
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none cursor-pointer"
                  >
                    <option value="High Performance & Strengths">High Performance & Strengths</option>
                    <option value="Peace Operations & UN">Peace Operations & UN</option>
                    <option value="Public Speaking & Debate">Public Speaking & Debate</option>
                    <option value="Social Work & Community">Social Work & Community</option>
                    <option value="Language Proficiency">Language Proficiency</option>
                    <option value="Digital Systems & Tech">Digital Systems & Tech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#94A3B8] mb-1 font-medium">Proficiency Level</label>
                  <select
                    value={level}
                    onChange={e => setLevel(e.target.value as any)}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none cursor-pointer"
                  >
                    <option value="Novice">Novice (Foundations)</option>
                    <option value="Intermediate">Intermediate (Practicing)</option>
                    <option value="Advanced">Advanced (High Competence)</option>
                    <option value="Mastery">Mastery (Certified Leader)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-medium">Practice / Study Hours</label>
                <input
                  type="number"
                  value={hoursInvested}
                  onChange={e => setHoursInvested(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-medium">Milestones or Application Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Completed POTI simulation or applied in debate tournament"
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl p-2.5 text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#18223A] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white font-semibold rounded-xl transition shadow-lg shadow-[#7C5CFC]/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Skills'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

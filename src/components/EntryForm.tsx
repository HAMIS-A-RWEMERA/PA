import React, { useState } from 'react';
import { format } from 'date-fns';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { PlusCircle, CheckSquare, DollarSign, Wallet, Target, Sparkles, Award } from 'lucide-react';

export default function EntryForm({ onAdded, goals }: { onAdded: () => void, goals: any[] }) {
  const [type, setType] = useState<'task' | 'expense' | 'income' | 'goal' | 'skill'>('task');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [goalId, setGoalId] = useState('');
  const [skills, setSkills] = useState('');
  const [skillLevel, setSkillLevel] = useState<'Novice' | 'Intermediate' | 'Advanced' | 'Mastery'>('Intermediate');
  const [hoursInvested, setHoursInvested] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSubmitting(true);
    const entryDate = date || format(new Date(), 'yyyy-MM-dd');
    try {
      const collectionName = type === 'task' ? 'tasks' : type === 'expense' ? 'expenses' : type === 'income' ? 'income' : type === 'goal' ? 'goals' : 'skills';
      const data: any = {
        userId: auth.currentUser.uid,
        date: entryDate
      };
      if (type === 'task') {
        data.description = description;
        data.completed = false;
        data.priority = priority;
        data.goalId = goalId || null;
        data.skills = skills.split(',').map(s => s.trim()).filter(s => s);
      } else if (type === 'goal') {
        data.goalDescription = description;
        data.target = target;
      } else if (type === 'skill') {
        data.name = description;
        data.category = category || 'General';
        data.level = skillLevel;
        data.hoursInvested = parseFloat(hoursInvested) || 0;
        data.notes = target || '';
      } else {
        data.amount = parseFloat(amount);
        data.category = category;
      }
      await addDoc(collection(db, collectionName), data);
      onAdded();
      setDescription('');
      setAmount('');
      setCategory('');
      setTarget('');
      setDate('');
      setPriority('medium');
      setGoalId('');
      setSkills('');
      setHoursInvested('');
    } catch (error) {
      console.error('Error adding document: ', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTabIcon = (t: 'task' | 'expense' | 'income' | 'goal' | 'skill') => {
    switch (t) {
      case 'task': return <CheckSquare size={14} />;
      case 'expense': return <DollarSign size={14} className="text-[#FB7185]" />;
      case 'income': return <Wallet size={14} className="text-[#34D399]" />;
      case 'goal': return <Target size={14} className="text-[#22D3EE]" />;
      case 'skill': return <Award size={14} className="text-[#FBBF24]" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#121A2E] p-6 rounded-2xl shadow-xl border border-[#1E293B] text-[#F8FAFC]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
          <PlusCircle size={18} className="text-[#7C5CFC]" />
          <span>Quick Capture</span>
        </h2>
        <span className="text-xs text-[#94A3B8]">Add to your system</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['task', 'expense', 'income', 'goal', 'skill'] as const).map(t => {
          const isActive = type === t;
          return (
            <button 
              key={t} 
              type="button" 
              onClick={() => setType(t)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
                isActive 
                  ? 'bg-[#7C5CFC] border-[#7C5CFC] text-[#F8FAFC] shadow-lg shadow-[#7C5CFC]/20' 
                  : 'bg-[#18223A] border-[#1E293B] text-[#94A3B8] hover:border-[#7C5CFC]/40 hover:text-[#F8FAFC]'
              }`}
            >
              {getTabIcon(t)}
              <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            </button>
          );
        })}
      </div>
      
      {type === 'task' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Task Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="What needs intentional focus?" 
              className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
              required 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Priority</label>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value as 'high' | 'medium' | 'low')} 
                className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] cursor-pointer"
              >
                <option value="high" className="bg-[#121A2E] text-[#FB7185]">High Priority (Critical)</option>
                <option value="medium" className="bg-[#121A2E] text-[#FBBF24]">Medium Priority</option>
                <option value="low" className="bg-[#121A2E] text-[#22D3EE]">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Link to Goal (Optional)</label>
              <select 
                value={goalId} 
                onChange={e => setGoalId(e.target.value)} 
                className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] cursor-pointer"
              >
                <option value="" className="bg-[#121A2E]">No Linked Goal</option>
                {goals.map(goal => (
                  <option key={goal.id} value={goal.id} className="bg-[#121A2E]">{goal.goalDescription}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Skill Development Tags</label>
            <input 
              type="text" 
              value={skills} 
              onChange={e => setSkills(e.target.value)} 
              placeholder="e.g. TypeScript, System Design, Public Speaking" 
              className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
            />
          </div>
        </div>
      )}

      {(type === 'expense' || type === 'income') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">
              Amount (RWF)
            </label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              placeholder="e.g. 15000" 
              className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Category</label>
            <input 
              type="text" 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              placeholder={type === 'expense' ? 'e.g. Cloud Hosting, Groceries, Books' : 'e.g. Freelance Client, Stipend'} 
              className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
              required 
            />
          </div>
        </div>
      )}

      {type === 'goal' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Goal Vision</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="e.g. Master Distributed Systems" 
              className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Measurable Target</label>
            <input 
              type="text" 
              value={target} 
              onChange={e => setTarget(e.target.value)} 
              placeholder="e.g. Read 3 books & ship 2 services" 
              className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
              required 
            />
          </div>
        </div>
      )}

      {type === 'skill' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Skill / Competency Name</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="e.g. UN Operational Logistics, Public Speaking" 
                className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Competency Category</label>
              <input 
                type="text" 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                placeholder="e.g. Peace Operations, Strengths, Social Work" 
                className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Proficiency Level</label>
              <select 
                value={skillLevel} 
                onChange={e => setSkillLevel(e.target.value as any)} 
                className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] cursor-pointer"
              >
                <option value="Novice" className="bg-[#121A2E]">Novice (Foundational)</option>
                <option value="Intermediate" className="bg-[#121A2E]">Intermediate (Working Proficiency)</option>
                <option value="Advanced" className="bg-[#121A2E]">Advanced (High Performance)</option>
                <option value="Mastery" className="bg-[#121A2E]">Mastery (Mentor / Certified Leader)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Practice / Study Hours</label>
              <input 
                type="number" 
                value={hoursInvested} 
                onChange={e => setHoursInvested(e.target.value)} 
                placeholder="e.g. 15" 
                className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Milestone Notes / Application Details</label>
            <input 
              type="text" 
              value={target} 
              onChange={e => setTarget(e.target.value)} 
              placeholder="e.g. Completed POTI simulation exam with distinction" 
              className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition" 
            />
          </div>
        </div>
      )}
      
      <div className="mt-3">
        <label className="block text-xs font-medium text-[#94A3B8] mb-1">Date (Defaults to today)</label>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="w-full p-3 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl text-sm text-[#F8FAFC] transition" 
        />
      </div>
      
      <button 
        type="submit" 
        disabled={submitting}
        className="w-full mt-4 py-3 bg-[#7C5CFC] hover:bg-[#6844F7] text-[#F8FAFC] font-semibold rounded-xl shadow-lg shadow-[#7C5CFC]/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
      >
        <PlusCircle size={16} />
        <span>{submitting ? 'Saving...' : `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}</span>
      </button>
    </form>
  );
}

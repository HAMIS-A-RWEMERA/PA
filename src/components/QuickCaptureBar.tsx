import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { 
  Plus, Pin, Palette, CheckSquare, Tag, 
  DollarSign, Wallet, Target, Sparkles, X, Check,
  Layers, ArrowRight, Award
} from 'lucide-react';
import { TaskColor, KEEP_COLORS, getKeepColorStyle } from '../types';

interface QuickCaptureBarProps {
  goals: any[];
  onAdded?: () => void;
}

const PRESET_TAGS = ['deep-work', 'high-priority', 'runway', 'health', 'learning', 'personal', 'peace-ops', 'debate'];

export default function QuickCaptureBar({ goals, onAdded }: QuickCaptureBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [entryType, setEntryType] = useState<'task' | 'reflection' | 'expense' | 'income' | 'goal' | 'skill'>('task');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [goalId, setGoalId] = useState('');
  const [pinned, setPinned] = useState(false);
  const [selectedColor, setSelectedColor] = useState<TaskColor>('default');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Checklist items
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [subtasks, setSubtasks] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Financial fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [target, setTarget] = useState('');

  // Skill fields
  const [skillLevel, setSkillLevel] = useState<'Novice' | 'Intermediate' | 'Advanced' | 'Mastery'>('Intermediate');
  const [skillCategory, setSkillCategory] = useState('High Performance');
  const [hoursInvested, setHoursInvested] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to collapse safely
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!description.trim() && subtasks.length === 0 && !amount.trim()) {
          setIsExpanded(false);
          setShowColorPicker(false);
          setShowTagInput(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [description, subtasks, amount]);

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: Date.now().toString(), text: newSubtaskText.trim(), completed: false }
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const clean = customTagInput.trim().replace(/^#/, '').toLowerCase();
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setCustomTagInput('');
      setShowTagInput(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('');
    setTarget('');
    setSkillLevel('Intermediate');
    setSkillCategory('High Performance');
    setHoursInvested('');
    setPriority('medium');
    setGoalId('');
    setPinned(false);
    setSelectedColor('default');
    setIsChecklistMode(false);
    setSubtasks([]);
    setNewSubtaskText('');
    setTags([]);
    setIsExpanded(false);
    setShowColorPicker(false);
    setShowTagInput(false);
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    if (!description.trim() && subtasks.length === 0 && !amount.trim() && !target.trim()) {
      setIsExpanded(false);
      return;
    }

    setIsSubmitting(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      if (entryType === 'task') {
        const taskTitle = description.trim() || (subtasks[0] ? subtasks[0].text : 'New Task');
        await addDoc(collection(db, 'tasks'), {
          userId: auth.currentUser.uid,
          description: taskTitle,
          completed: false,
          priority,
          goalId: goalId || null,
          date: today,
          pinned,
          color: selectedColor,
          subtasks: subtasks.map(s => ({ id: s.id, text: s.text, completed: s.completed })),
          tags,
          isArchived: false,
          skills: tags
        });
      } else if (entryType === 'reflection') {
        await addDoc(collection(db, 'reflections'), {
          userId: auth.currentUser.uid,
          content: description.trim(),
          date: today
        });
      } else if (entryType === 'expense') {
        await addDoc(collection(db, 'expenses'), {
          userId: auth.currentUser.uid,
          amount: parseFloat(amount) || 0,
          category: category.trim() || 'General Expense',
          date: today
        });
      } else if (entryType === 'income') {
        await addDoc(collection(db, 'income'), {
          userId: auth.currentUser.uid,
          amount: parseFloat(amount) || 0,
          category: category.trim() || 'General Income',
          date: today
        });
      } else if (entryType === 'goal') {
        await addDoc(collection(db, 'goals'), {
          userId: auth.currentUser.uid,
          goalDescription: description.trim(),
          target: target.trim() || 'Measurable outcome',
          date: today
        });
      } else if (entryType === 'skill') {
        await addDoc(collection(db, 'skills'), {
          userId: auth.currentUser.uid,
          name: description.trim() || 'New Competency',
          category: skillCategory.trim() || 'General',
          level: skillLevel,
          hoursInvested: parseFloat(hoursInvested) || 0,
          notes: target.trim() || '',
          tags: tags.length > 0 ? tags : [skillCategory.toLowerCase()],
          date: today
        });
      }

      onAdded?.();
      resetForm();
    } catch (err) {
      console.error('Failed to save quick capture item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorStyle = getKeepColorStyle(selectedColor);

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto my-4">
      {!isExpanded ? (
        /* Collapsed Floating Keep Bar */
        <div 
          onClick={() => setIsExpanded(true)}
          className="bg-[#121A2E] hover:bg-[#18223A] border border-[#1E293B] hover:border-[#7C5CFC]/40 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg shadow-black/20 cursor-text transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 text-sm text-[#94A3B8] font-normal select-none">
            <Plus size={18} className="text-[#7C5CFC] group-hover:rotate-90 transition-transform duration-200" />
            <span>Take a note, task, or thought...</span>
          </div>

          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => {
                setIsChecklistMode(true);
                setEntryType('task');
                setIsExpanded(true);
              }}
              title="New checklist"
              className="p-2 text-[#94A3B8] hover:text-[#7C5CFC] hover:bg-[#1E293B] rounded-xl transition cursor-pointer"
            >
              <CheckSquare size={17} />
            </button>

            <button 
              onClick={() => {
                setEntryType('expense');
                setIsExpanded(true);
              }}
              title="Log expense"
              className="p-2 text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#1E293B] rounded-xl transition cursor-pointer"
            >
              <DollarSign size={17} />
            </button>

            <button 
              onClick={() => {
                setEntryType('income');
                setIsExpanded(true);
              }}
              title="Log income"
              className="p-2 text-[#94A3B8] hover:text-[#34D399] hover:bg-[#1E293B] rounded-xl transition cursor-pointer"
            >
              <Wallet size={17} />
            </button>

            <button 
              onClick={() => {
                setEntryType('goal');
                setIsExpanded(true);
              }}
              title="Add North Star goal"
              className="p-2 text-[#94A3B8] hover:text-[#22D3EE] hover:bg-[#1E293B] rounded-xl transition cursor-pointer"
            >
              <Target size={17} />
            </button>

            <button 
              onClick={() => {
                setEntryType('skill');
                setIsExpanded(true);
              }}
              title="Log skill or competency"
              className="p-2 text-[#94A3B8] hover:text-[#FBBF24] hover:bg-[#1E293B] rounded-xl transition cursor-pointer"
            >
              <Award size={17} />
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Floating Keep Composer */
        <div className={`${colorStyle.bg} border ${colorStyle.border} rounded-2xl shadow-2xl p-5 transition-all duration-200`}>
          {/* Top Domain Switcher & Pin button */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1E293B]/60">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {(['task', 'reflection', 'expense', 'income', 'goal', 'skill'] as const).map(type => {
                const active = entryType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEntryType(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition flex items-center gap-1.5 cursor-pointer border ${
                      active 
                        ? 'bg-[#7C5CFC] text-[#F8FAFC] border-[#7C5CFC]' 
                        : 'bg-[#0B1020]/40 text-[#94A3B8] hover:text-[#F8FAFC] border-transparent'
                    }`}
                  >
                    {type === 'task' && <CheckSquare size={12} />}
                    {type === 'reflection' && <Sparkles size={12} />}
                    {type === 'expense' && <DollarSign size={12} className="text-[#FB7185]" />}
                    {type === 'income' && <Wallet size={12} className="text-[#34D399]" />}
                    {type === 'goal' && <Target size={12} className="text-[#22D3EE]" />}
                    {type === 'skill' && <Award size={12} className="text-[#FBBF24]" />}
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>

            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`p-2 rounded-xl transition cursor-pointer border ${
                pinned 
                  ? 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40' 
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0B1020]/40 border-transparent'
              }`}
              title={pinned ? 'Unpin item' : 'Pin to top of board'}
            >
              <Pin size={16} fill={pinned ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="space-y-3">
            <input 
              type="text"
              autoFocus
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={
                entryType === 'task' 
                  ? "Task title or main objective..." 
                  : entryType === 'reflection' 
                  ? "Record a strategic insight or reflection..." 
                  : entryType === 'goal' 
                  ? "Core goal or vision statement..." 
                  : entryType === 'expense'
                  ? "Expense note / merchant..."
                  : entryType === 'income'
                  ? "Income source / client / scholarship / contract note..."
                  : "Skill or competency name (e.g. UN Operational Logistics, Public Debate, TypeScript)..."
              }
              className="w-full bg-transparent text-base sm:text-lg font-medium text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none"
            />

            {/* In-Card Interactive Checklist Editor */}
            {entryType === 'task' && isChecklistMode && (
              <div className="space-y-2 pt-2">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 text-xs text-[#F8FAFC]">
                    <CheckSquare size={14} className="text-[#7C5CFC] flex-shrink-0" />
                    <span className="flex-1">{st.text}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-[#94A3B8] hover:text-[#FB7185] p-1 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 text-xs">
                  <Plus size={14} className="text-[#94A3B8] flex-shrink-0" />
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={e => setNewSubtaskText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Add checklist item (press Enter)..."
                    className="flex-1 bg-transparent text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none py-1"
                  />
                  {newSubtaskText.trim() && (
                    <button 
                      type="button" 
                      onClick={handleAddSubtask}
                      className="px-2 py-0.5 rounded bg-[#7C5CFC] text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Expense Specific Inputs */}
            {entryType === 'expense' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Expense Amount (RWF)</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 12000"
                    className="w-full p-2 bg-[#0B1020]/50 border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C5CFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Expense Category</label>
                  <input 
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Food, Hosting, Commute"
                    className="w-full p-2 bg-[#0B1020]/50 border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C5CFC]"
                  />
                </div>
              </div>
            )}

            {/* Income Specific Inputs */}
            {entryType === 'income' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-[#34D399] font-medium mb-1">Income Amount (RWF)</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full p-2 bg-[#0B1020]/50 border border-[#34D399]/40 rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#34D399]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Income Stream / Category</label>
                  <input 
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Freelance, Stipend, Grant, Contract, Salary"
                    className="w-full p-2 bg-[#0B1020]/50 border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C5CFC]"
                  />
                </div>
              </div>
            )}

            {/* Skill Specific Inputs */}
            {entryType === 'skill' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-[#FBBF24] font-medium mb-1">Competency Category</label>
                  <select
                    value={skillCategory}
                    onChange={e => setSkillCategory(e.target.value)}
                    className="w-full p-2 bg-[#0B1020]/70 border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C5CFC] cursor-pointer"
                  >
                    <option value="Peace Operations & UN">Peace Operations & UN</option>
                    <option value="High Performance & Strengths">High Performance & Strengths</option>
                    <option value="Public Speaking & Debate">Public Speaking & Debate</option>
                    <option value="Social Work & Community">Social Work & Community</option>
                    <option value="Language Proficiency">Language Proficiency</option>
                    <option value="Digital Systems & Tech">Digital Systems & Tech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Proficiency Level</label>
                  <select
                    value={skillLevel}
                    onChange={e => setSkillLevel(e.target.value as any)}
                    className="w-full p-2 bg-[#0B1020]/70 border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C5CFC] cursor-pointer"
                  >
                    <option value="Novice">Novice (Foundations)</option>
                    <option value="Intermediate">Intermediate (Practicing)</option>
                    <option value="Advanced">Advanced (High Competence)</option>
                    <option value="Mastery">Mastery (Mentor / Top Tier)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Hours Invested / Target</label>
                  <input
                    type="number"
                    value={hoursInvested}
                    onChange={e => setHoursInvested(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full p-2 bg-[#0B1020]/50 border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C5CFC]"
                  />
                </div>
              </div>
            )}

            {/* Goal Specific Inputs */}
            {entryType === 'goal' && (
              <div className="pt-2">
                <label className="block text-[11px] text-[#94A3B8] mb-1">Target / Measurable Milestone</label>
                <input 
                  type="text"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  placeholder="e.g. 3 deep work blocks per day"
                  className="w-full p-2 bg-[#0B1020]/50 border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C5CFC]"
                />
              </div>
            )}

            {/* Optional Task Meta: Priority & Linked Goal */}
            {entryType === 'task' && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <div className="flex items-center gap-1 bg-[#0B1020]/50 px-2 py-1 rounded-lg border border-[#1E293B]">
                  <span className="text-[#94A3B8] text-[11px]">Priority:</span>
                  <select 
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="bg-transparent text-xs text-[#F8FAFC] focus:outline-none cursor-pointer"
                  >
                    <option value="high" className="bg-[#121A2E] text-[#FB7185]">High Priority</option>
                    <option value="medium" className="bg-[#121A2E] text-[#FBBF24]">Medium</option>
                    <option value="low" className="bg-[#121A2E] text-[#22D3EE]">Low</option>
                  </select>
                </div>

                {goals.length > 0 && (
                  <div className="flex items-center gap-1 bg-[#0B1020]/50 px-2 py-1 rounded-lg border border-[#1E293B]">
                    <Target size={12} className="text-[#22D3EE]" />
                    <select 
                      value={goalId}
                      onChange={e => setGoalId(e.target.value)}
                      className="bg-transparent text-xs text-[#F8FAFC] focus:outline-none cursor-pointer max-w-[150px] truncate"
                    >
                      <option value="" className="bg-[#121A2E]">No Linked Goal</option>
                      {goals.map(g => (
                        <option key={g.id} value={g.id} className="bg-[#121A2E]">{g.goalDescription}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Tag / Label Chips Row */}
            <div className="pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_TAGS.map(tag => {
                  const isSelected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                        isSelected 
                          ? 'bg-[#7C5CFC]/30 text-[#7C5CFC] border-[#7C5CFC]' 
                          : 'bg-[#0B1020]/40 text-[#94A3B8] hover:text-[#F8FAFC] border-[#1E293B]'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}

                {tags.filter(t => !PRESET_TAGS.includes(t)).map(customTag => (
                  <span 
                    key={customTag}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40 flex items-center gap-1"
                  >
                    #{customTag}
                    <button type="button" onClick={() => toggleTag(customTag)} className="hover:text-white cursor-pointer">
                      <X size={10} />
                    </button>
                  </span>
                ))}

                {showTagInput ? (
                  <input 
                    type="text"
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={handleAddCustomTag}
                    placeholder="Type tag & Enter..."
                    className="text-[11px] px-2 py-0.5 rounded-full bg-[#0B1020] text-[#F8FAFC] border border-[#7C5CFC] focus:outline-none w-28"
                  />
                ) : (
                  <button 
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-[#0B1020]/40 text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E293B] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={10} />
                    <span>Tag</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Color Picker Flyout */}
          {showColorPicker && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1E293B]/60 animate-in fade-in duration-150">
              <span className="text-[11px] text-[#94A3B8] mr-1">Color:</span>
              {KEEP_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.id);
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded-full border transition flex items-center justify-center cursor-pointer ${c.bg} ${
                    selectedColor === c.id ? 'ring-2 ring-white border-transparent' : 'border-[#1E293B] hover:scale-110'
                  }`}
                  title={c.name}
                >
                  {selectedColor === c.id && <Check size={11} className="text-white" />}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[#1E293B]/60">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0B1020]/40 transition cursor-pointer ${
                  showColorPicker ? 'text-[#7C5CFC] bg-[#0B1020]/60' : ''
                }`}
                title="Change note color"
              >
                <Palette size={16} />
              </button>

              {entryType === 'task' && (
                <button
                  type="button"
                  onClick={() => setIsChecklistMode(!isChecklistMode)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isChecklistMode 
                      ? 'text-[#7C5CFC] bg-[#0B1020]/60' 
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0B1020]/40'
                  }`}
                  title={isChecklistMode ? 'Remove checklist' : 'Add checklist items'}
                >
                  <CheckSquare size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0B1020]/40 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#7C5CFC] hover:bg-[#6947F0] text-[#F8FAFC] shadow-lg shadow-[#7C5CFC]/20 transition cursor-pointer disabled:opacity-50"
              >
                <span>Save</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

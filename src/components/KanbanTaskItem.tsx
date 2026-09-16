import { useState } from 'react';
import { 
  Check, Play, Square, Sparkles, Clock, Target, Pin, 
  Palette, Tag, Archive, ArchiveRestore, Trash2, Plus, 
  CheckSquare, ChevronDown, ChevronUp, X 
} from 'lucide-react';
import { Task, TaskColor, KEEP_COLORS, getKeepColorStyle } from '../types';

interface KanbanTaskItemProps {
  task: Task;
  goalDesc: string | null;
  onToggle: (id: string, completed: boolean, reflection?: string) => void;
  onStartTimer: (id: string) => void;
  onStopTimer: (id: string) => void;
  activeTaskId: string | null;
  onTogglePin?: (id: string, currentPinned: boolean) => void;
  onUpdateColor?: (id: string, color: TaskColor) => void;
  onToggleSubtask?: (id: string, subtaskIndex: number) => void;
  onAddSubtask?: (id: string, text: string) => void;
  onDeleteSubtask?: (id: string, subtaskIndex: number) => void;
  onToggleArchive?: (id: string, currentArchived: boolean) => void;
  onDeleteTask?: (id: string) => void;
  onFilterTag?: (tag: string) => void;
}

export default function KanbanTaskItem({ 
  task, 
  goalDesc, 
  onToggle, 
  onStartTimer, 
  onStopTimer, 
  activeTaskId,
  onTogglePin,
  onUpdateColor,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onToggleArchive,
  onDeleteTask,
  onFilterTag
}: KanbanTaskItemProps) {
  const [reflection, setReflection] = useState(task.reflection || '');
  const [showReflectionInput, setShowReflectionInput] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  const isTimerActive = activeTaskId === task.id;
  const colorStyle = getKeepColorStyle(task.color);

  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-[#FB7185]/40 bg-[#FB7185]/15 text-[#FB7185]';
      case 'medium':
        return 'border-[#FBBF24]/40 bg-[#FBBF24]/15 text-[#FBBF24]';
      case 'low':
      default:
        return 'border-[#22D3EE]/40 bg-[#22D3EE]/15 text-[#22D3EE]';
    }
  };

  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    onAddSubtask?.(task.id, newSubtaskText.trim());
    setNewSubtaskText('');
  };

  return (
    <div 
      className={`group/card rounded-2xl border transition-all duration-200 mb-3 shadow-md relative overflow-hidden ${colorStyle.bg} ${
        isTimerActive 
          ? 'border-[#7C5CFC] ring-2 ring-[#7C5CFC]/40 shadow-xl shadow-[#7C5CFC]/15' 
          : task.pinned 
          ? 'border-[#FBBF24]/50 shadow-lg shadow-black/30' 
          : `${colorStyle.border} hover:border-[#7C5CFC]/40`
      }`}
    >
      {/* Top Header Row: Title, Priority, Pin button */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-start gap-2">
              {/* Task Completion Checkbox */}
              <button
                type="button"
                onClick={() => onToggle(task.id, task.completed, reflection)}
                className={`mt-0.5 rounded-lg transition cursor-pointer flex-shrink-0 p-0.5 ${
                  task.completed 
                    ? 'text-[#34D399] bg-[#34D399]/10' 
                    : 'text-[#94A3B8] hover:text-[#34D399]'
                }`}
                title={task.completed ? 'Mark uncompleted' : 'Mark task completed'}
              >
                {task.completed ? <CheckSquare size={17} /> : <Square size={17} />}
              </button>

              <div className="flex-1">
                <p className={`text-sm font-semibold leading-snug ${
                  task.completed ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'
                }`}>
                  {task.description}
                </p>

                {/* Subtask count badge if checklist exists */}
                {subtasks.length > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                    <CheckSquare size={12} className="text-[#7C5CFC]" />
                    <span>{completedSubtasksCount}/{subtasks.length} items</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Icons: Pin & Timer */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Pin Button */}
            <button
              type="button"
              onClick={() => onTogglePin?.(task.id, !!task.pinned)}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                task.pinned 
                  ? 'text-[#FBBF24] bg-[#FBBF24]/20 border border-[#FBBF24]/40' 
                  : 'text-[#94A3B8] opacity-60 group-hover/card:opacity-100 hover:text-[#FBBF24] hover:bg-black/20'
              }`}
              title={task.pinned ? 'Unpin task' : 'Pin to top of board'}
            >
              <Pin size={15} fill={task.pinned ? 'currentColor' : 'none'} />
            </button>

            {/* Timer Button */}
            {!task.completed && (
              <div>
                {isTimerActive ? (
                  <button 
                    onClick={() => onStopTimer(task.id)} 
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FB7185]/20 hover:bg-[#FB7185]/30 text-[#FB7185] border border-[#FB7185]/40 text-xs font-semibold transition cursor-pointer"
                    title="Stop focus timer"
                  >
                    <Square size={12} fill="currentColor" />
                    <span className="text-[11px]">Stop</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => onStartTimer(task.id)} 
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0B1020]/50 hover:bg-[#7C5CFC]/20 text-[#22D3EE] hover:text-[#F8FAFC] border border-[#1E293B] hover:border-[#7C5CFC]/50 text-xs font-medium transition cursor-pointer"
                    title="Start deep work timer"
                  >
                    <Play size={11} fill="currentColor" />
                    <span className="text-[11px]">Focus</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Badges: Priority, Date, Goal */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 ml-6">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getPriorityStyle(task.priority)}`}>
            {task.priority || 'MEDIUM'}
          </span>
          
          {task.date && (
            <span className="text-[10px] text-[#94A3B8] bg-[#0B1020]/40 px-2 py-0.5 rounded-md border border-[#1E293B]/60">
              {task.date}
            </span>
          )}

          {goalDesc && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#22D3EE] bg-[#0B1020]/50 px-2 py-0.5 rounded-md border border-[#1E293B]">
              <Target size={10} />
              <span className="truncate max-w-[130px]">{goalDesc}</span>
            </span>
          )}
        </div>

        {/* Labels & Tags Chips */}
        {(task.tags && task.tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1 mt-2 ml-6">
            {task.tags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => onFilterTag?.(tag)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0B1020]/60 text-[#7C5CFC] hover:text-[#F8FAFC] border border-[#7C5CFC]/25 transition cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive In-Card Checklist (Google Keep style) */}
      {subtasks.length > 0 && (
        <div className="px-4 py-2 my-1 space-y-1.5 border-t border-[#1E293B]/40">
          {subtasks.map((st, idx) => (
            <div 
              key={st.id || idx} 
              className="flex items-center justify-between gap-2 text-xs group/item py-0.5"
            >
              <div 
                onClick={() => onToggleSubtask?.(task.id, idx)}
                className="flex items-center gap-2 flex-1 cursor-pointer select-none"
              >
                <div className={`p-0.5 rounded transition ${st.completed ? 'text-[#34D399]' : 'text-[#94A3B8]'}`}>
                  {st.completed ? <CheckSquare size={13} /> : <Square size={13} />}
                </div>
                <span className={`text-xs ${st.completed ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'}`}>
                  {st.text}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onDeleteSubtask?.(task.id, idx)}
                className="opacity-0 group-hover/item:opacity-100 text-[#94A3B8] hover:text-[#FB7185] p-1 transition cursor-pointer"
                title="Remove item"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick In-line Add Subtask */}
      {showAddSubtask && (
        <form onSubmit={handleSubtaskSubmit} className="px-4 py-2 flex items-center gap-2 border-t border-[#1E293B]/40">
          <Square size={13} className="text-[#94A3B8] flex-shrink-0" />
          <input 
            type="text"
            autoFocus
            value={newSubtaskText}
            onChange={e => setNewSubtaskText(e.target.value)}
            placeholder="Add checklist item..."
            className="flex-1 bg-transparent text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none"
          />
          <button 
            type="submit" 
            className="text-xs px-2 py-0.5 rounded bg-[#7C5CFC] text-white font-semibold cursor-pointer"
          >
            Add
          </button>
          <button 
            type="button" 
            onClick={() => setShowAddSubtask(false)}
            className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] p-1 cursor-pointer"
          >
            <X size={12} />
          </button>
        </form>
      )}

      {/* Reflection Note display if present */}
      {task.reflection && (
        <div className="mx-4 my-2 text-xs bg-[#0B1020]/70 p-2 rounded-xl border border-[#1E293B]/80 text-[#34D399] flex items-start gap-1.5">
          <Sparkles size={12} className="flex-shrink-0 mt-0.5 text-[#34D399]" />
          <span className="italic">"{task.reflection}"</span>
        </div>
      )}

      {/* Meaningful Progress Reflection Drawer (Optional) */}
      {showReflectionInput && (
        <div className="px-4 py-2 border-t border-[#1E293B]/50">
          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[#94A3B8]">
            <Sparkles size={11} className="text-[#7C5CFC]" />
            <span>Reflection & Progress Note:</span>
          </div>
          <div className="flex gap-2">
            <input 
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="What did you learn or accomplish?"
              className="text-xs p-1.5 bg-[#0B1020]/60 border border-[#1E293B] focus:border-[#7C5CFC] rounded-lg flex-1 text-[#F8FAFC] placeholder-[#94A3B8]/50"
            />
            <button
              onClick={() => {
                onToggle(task.id, task.completed, reflection);
                setShowReflectionInput(false);
              }}
              className="px-2 py-1 bg-[#34D399]/20 text-[#34D399] text-xs font-semibold rounded-lg hover:bg-[#34D399]/30"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Color Palette Popover (Keep style) */}
      {showColorPalette && (
        <div className="px-4 py-2 border-t border-[#1E293B]/60 flex items-center gap-1.5 bg-[#0B1020]/70">
          <span className="text-[10px] text-[#94A3B8] mr-1">Tints:</span>
          {KEEP_COLORS.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onUpdateColor?.(task.id, c.id);
                setShowColorPalette(false);
              }}
              className={`w-5 h-5 rounded-full border transition flex items-center justify-center cursor-pointer ${c.bg} ${
                task.color === c.id ? 'ring-2 ring-white border-transparent' : 'border-[#1E293B] hover:scale-110'
              }`}
              title={c.name}
            >
              {task.color === c.id && <Check size={10} className="text-white" />}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Google Keep Action Toolbar (Appears cleanly on hover or touch) */}
      <div className="px-4 py-2 border-t border-[#1E293B]/30 flex items-center justify-between text-[#94A3B8]">
        <div className="flex items-center gap-1">
          {/* Color Palette Icon */}
          <button
            type="button"
            onClick={() => setShowColorPalette(!showColorPalette)}
            className="p-1.5 rounded-lg hover:text-[#F8FAFC] hover:bg-black/20 transition cursor-pointer"
            title="Color note"
          >
            <Palette size={14} />
          </button>

          {/* Add Checklist item */}
          <button
            type="button"
            onClick={() => setShowAddSubtask(!showAddSubtask)}
            className="p-1.5 rounded-lg hover:text-[#F8FAFC] hover:bg-black/20 transition cursor-pointer"
            title="Add checklist sub-item"
          >
            <Plus size={14} />
          </button>

          {/* Reflection trigger */}
          <button
            type="button"
            onClick={() => setShowReflectionInput(!showReflectionInput)}
            className={`p-1.5 rounded-lg hover:text-[#F8FAFC] hover:bg-black/20 transition cursor-pointer ${
              showReflectionInput || task.reflection ? 'text-[#34D399]' : ''
            }`}
            title="Add reflection note"
          >
            <Sparkles size={14} />
          </button>

          {/* Archive / Unarchive */}
          <button
            type="button"
            onClick={() => onToggleArchive?.(task.id, !!task.isArchived)}
            className={`p-1.5 rounded-lg hover:text-[#F8FAFC] hover:bg-black/20 transition cursor-pointer ${
              task.isArchived ? 'text-[#FBBF24]' : ''
            }`}
            title={task.isArchived ? 'Unarchive (restore to active board)' : 'Archive item'}
          >
            {task.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          </button>
        </div>

        {/* Delete Task */}
        <button
          type="button"
          onClick={() => {
            if (confirm('Delete this task?')) {
              onDeleteTask?.(task.id);
            }
          }}
          className="p-1.5 rounded-lg hover:text-[#FB7185] hover:bg-[#FB7185]/15 transition cursor-pointer opacity-60 hover:opacity-100"
          title="Delete task"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

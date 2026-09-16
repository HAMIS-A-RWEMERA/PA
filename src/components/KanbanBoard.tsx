import { useState, useMemo } from 'react';
import { 
  X, CheckCircle2, ListTodo, Sparkles, Pin, 
  Archive, Filter, Search, Tag, CheckSquare, Layers, 
  Grid, Check
} from 'lucide-react';
import KanbanTaskItem from './KanbanTaskItem';
import { Task, TaskColor } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  goals: any[];
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
}

export default function KanbanBoard({ 
  tasks, 
  goals, 
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
  onDeleteTask
}: KanbanBoardProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [filterPinnedOnly, setFilterPinnedOnly] = useState(false);

  // Extract all unique tags across tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(t => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [tasks]);

  // Filter tasks based on view mode (Active vs Archive), tag, search, and pinned
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Archive filter
      const isArchived = !!t.isArchived;
      if (showArchived && !isArchived) return false;
      if (!showArchived && isArchived) return false;

      // Pinned only filter
      if (filterPinnedOnly && !t.pinned) return false;

      // Tag filter
      if (selectedTag && (!t.tags || !t.tags.includes(selectedTag))) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = t.description?.toLowerCase().includes(query);
        const refMatch = t.reflection?.toLowerCase().includes(query);
        const tagMatch = t.tags?.some(tag => tag.toLowerCase().includes(query));
        const subtaskMatch = t.subtasks?.some(st => st.text.toLowerCase().includes(query));
        if (!descMatch && !refMatch && !tagMatch && !subtaskMatch) return false;
      }

      return true;
    });
  }, [tasks, showArchived, filterPinnedOnly, selectedTag, searchQuery]);

  // Split into Pinned vs Others (Classic Google Keep hierarchy)
  const pinnedTasks = useMemo(() => filteredTasks.filter(t => t.pinned && !t.completed), [filteredTasks]);
  const unpinnedTodoTasks = useMemo(() => filteredTasks.filter(t => !t.pinned && !t.completed), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(t => t.completed), [filteredTasks]);

  const getGoalDescription = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.goalDescription : null;
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-[#0B1020]/90 p-4 rounded-2xl border border-[#1E293B] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, notes, checklists, #tags..."
              className="w-full pl-9 pr-3 py-2 bg-[#121A2E] border border-[#1E293B] focus:border-[#7C5CFC] rounded-xl text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* View Mode Controls: Active vs Archive & Pinned Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterPinnedOnly(!filterPinnedOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                filterPinnedOnly 
                  ? 'bg-[#FBBF24]/20 border-[#FBBF24] text-[#FBBF24]' 
                  : 'bg-[#121A2E] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title="Filter pinned items"
            >
              <Pin size={13} fill={filterPinnedOnly ? 'currentColor' : 'none'} />
              <span>Pinned</span>
            </button>

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                showArchived 
                  ? 'bg-[#7C5CFC]/20 border-[#7C5CFC] text-[#7C5CFC]' 
                  : 'bg-[#121A2E] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title="Toggle archived items"
            >
              <Archive size={13} />
              <span>{showArchived ? 'View Active' : 'Archive'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#18223A] border border-[#1E293B]">
                {tasks.filter(t => t.isArchived).length}
              </span>
            </button>
          </div>
        </div>

        {/* Tag / Label Chips Filter Row (Keep style) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 overflow-x-auto">
          <span className="text-[11px] text-[#94A3B8] flex items-center gap-1 mr-1">
            <Tag size={11} />
            <span>Labels:</span>
          </span>

          <button
            onClick={() => setSelectedTag(null)}
            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
              selectedTag === null 
                ? 'bg-[#7C5CFC] text-white border-[#7C5CFC] font-semibold' 
                : 'bg-[#121A2E] text-[#94A3B8] hover:text-[#F8FAFC] border-[#1E293B]'
            }`}
          >
            All ({filteredTasks.length})
          </button>

          {allTags.map(tag => {
            const isSelected = selectedTag === tag;
            const count = tasks.filter(t => t.tags?.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer flex items-center gap-1 ${
                  isSelected 
                    ? 'bg-[#7C5CFC] text-white border-[#7C5CFC] font-semibold' 
                    : 'bg-[#121A2E] text-[#94A3B8] hover:text-[#F8FAFC] border-[#1E293B]'
                }`}
              >
                <span>#{tag}</span>
                <span className="text-[9px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Archive Header Banner if viewing Archive */}
      {showArchived && (
        <div className="bg-[#121A2E] p-3.5 rounded-2xl border border-[#7C5CFC]/30 flex items-center justify-between text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2 text-[#7C5CFC] font-semibold">
            <Archive size={16} />
            <span>Viewing Archived Workspace Items</span>
          </div>
          <button 
            onClick={() => setShowArchived(false)}
            className="text-xs text-[#22D3EE] hover:underline cursor-pointer"
          >
            Return to Active Board
          </button>
        </div>
      )}

      {/* PINNED SECTION (Google Keep's Pinned Items Anchor) */}
      {!showArchived && pinnedTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin size={14} className="text-[#FBBF24]" fill="currentColor" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FBBF24]">
              Pinned Priority Focus ({pinnedTasks.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedTasks.map(task => {
              const goalDesc = task.goalId ? getGoalDescription(task.goalId) : null;
              return (
                <KanbanTaskItem 
                  key={task.id}
                  task={task}
                  goalDesc={goalDesc}
                  onToggle={onToggle}
                  onStartTimer={onStartTimer}
                  onStopTimer={onStopTimer}
                  activeTaskId={activeTaskId}
                  onTogglePin={onTogglePin}
                  onUpdateColor={onUpdateColor}
                  onToggleSubtask={onToggleSubtask}
                  onAddSubtask={onAddSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onToggleArchive={onToggleArchive}
                  onDeleteTask={onDeleteTask}
                  onFilterTag={tag => setSelectedTag(tag)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN KANBAN BOARD COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Queue / Others */}
        <div className="bg-[#0B1020] p-4 rounded-2xl border border-[#1E293B]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListTodo size={16} className="text-[#7C5CFC]" />
              <h3 className="font-bold text-sm text-[#F8FAFC]">
                {pinnedTasks.length > 0 ? 'Other Active Tasks' : 'Active Queue'}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#18223A] text-[#7C5CFC] border border-[#7C5CFC]/30">
              {unpinnedTodoTasks.length}
            </span>
          </div>

          {unpinnedTodoTasks.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#94A3B8] border border-dashed border-[#1E293B] rounded-xl bg-[#121A2E]/40 px-4">
              {pinnedTasks.length > 0 
                ? 'All other active tasks are currently pinned above!' 
                : 'No active tasks found matching criteria. Use the Quick Capture bar above to log a thought, note, or task!'}
            </div>
          ) : (
            <div className="space-y-3">
              {unpinnedTodoTasks.map(task => {
                const goalDesc = task.goalId ? getGoalDescription(task.goalId) : null;
                return (
                  <KanbanTaskItem 
                    key={task.id}
                    task={task}
                    goalDesc={goalDesc}
                    onToggle={onToggle}
                    onStartTimer={onStartTimer}
                    onStopTimer={onStopTimer}
                    activeTaskId={activeTaskId}
                    onTogglePin={onTogglePin}
                    onUpdateColor={onUpdateColor}
                    onToggleSubtask={onToggleSubtask}
                    onAddSubtask={onAddSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    onToggleArchive={onToggleArchive}
                    onDeleteTask={onDeleteTask}
                    onFilterTag={tag => setSelectedTag(tag)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Completed & Reflected Column */}
        <div className="bg-[#0B1020] p-4 rounded-2xl border border-[#1E293B]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#34D399]" />
              <h3 className="font-bold text-sm text-[#F8FAFC]">Completed & Reflected</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#18223A] text-[#34D399] border border-[#34D399]/30">
              {completedTasks.length}
            </span>
          </div>

          {completedTasks.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#94A3B8] border border-dashed border-[#1E293B] rounded-xl bg-[#121A2E]/40 px-4">
              Completed tasks with reflections and subtask checkpoints will appear here.
            </div>
          ) : (
            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {completedTasks.map(task => {
                const goalDesc = task.goalId ? getGoalDescription(task.goalId) : null;
                return (
                  <KanbanTaskItem 
                    key={task.id}
                    task={task}
                    goalDesc={goalDesc}
                    onToggle={onToggle}
                    onStartTimer={onStartTimer}
                    onStopTimer={onStopTimer}
                    activeTaskId={activeTaskId}
                    onTogglePin={onTogglePin}
                    onUpdateColor={onUpdateColor}
                    onToggleSubtask={onToggleSubtask}
                    onAddSubtask={onAddSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    onToggleArchive={onToggleArchive}
                    onDeleteTask={onDeleteTask}
                    onFilterTag={tag => setSelectedTag(tag)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Clock, CalendarDays } from 'lucide-react';

export default function CalendarView({ tasks }: { tasks: any[] }) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const today = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0 for Sunday

  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const activeTasks = tasks.filter(t => !t.isArchived);
  const selectedDayTasks = activeTasks.filter(t => t.date === selectedDayStr);

  return (
    <div className="bg-[#121A2E] p-6 rounded-2xl shadow-xl border border-[#1E293B] text-[#F8FAFC]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">{format(currentMonth, 'MMMM yyyy')}</h2>
            <p className="text-xs text-[#94A3B8]">Monthly cadence, scheduled priorities & deadlines</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-xl bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDay(new Date());
            }}
            className="px-3 py-1.5 rounded-xl bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-xl bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider py-1">
            {d}
          </div>
        ))}

        {/* Empty padding cells for start of month alignment */}
        {Array.from({ length: startDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="p-2.5 min-h-[56px] rounded-xl border border-transparent opacity-0" />
        ))}

        {days.map(day => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDay);
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTasks = activeTasks.filter(t => t.date === dayStr);
          const hasTask = dayTasks.length > 0;

          return (
            <div 
              key={day.toString()} 
              onClick={() => setSelectedDay(day)}
              className={`p-1.5 sm:p-2.5 min-h-[48px] sm:min-h-[56px] rounded-xl border flex flex-col justify-between items-center transition cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[#7C5CFC] bg-[#7C5CFC]/25 border-[#7C5CFC] text-[#F8FAFC] font-bold'
                  : isToday 
                  ? 'bg-[#7C5CFC]/15 border-[#7C5CFC]/60 text-[#F8FAFC] font-semibold'
                  : hasTask 
                  ? 'bg-[#18223A] border-[#22D3EE]/40 text-[#22D3EE] hover:border-[#22D3EE]' 
                  : 'bg-[#0B1020] border-[#1E293B] text-[#94A3B8] hover:border-[#1E293B]/80 hover:bg-[#121A2E]'
              }`}
            >
              <span className="text-xs font-semibold">{format(day, 'd')}</span>
              {hasTask && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                  {dayTasks.length > 1 && (
                    <span className="text-[9px] font-mono text-[#22D3EE] leading-none">+{dayTasks.length - 1}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Agenda Drawer */}
      <div className="pt-4 border-t border-[#1E293B] mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <CalendarDays size={14} className="text-[#22D3EE]" />
            <span className="font-semibold text-[#F8FAFC]">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#18223A] text-[#94A3B8] border border-[#1E293B]">
            {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'priority' : 'priorities'}
          </span>
        </div>

        {selectedDayTasks.length === 0 ? (
          <p className="text-xs text-[#94A3B8]/80 italic py-2">
            No specific deadlines or scheduled tasks for this date.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {selectedDayTasks.map(t => (
              <div 
                key={t.id} 
                className="bg-[#18223A] p-2.5 rounded-xl border border-[#1E293B] flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 size={14} className={t.completed ? 'text-[#34D399]' : 'text-[#94A3B8]'} />
                  <span className={`truncate ${t.completed ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'}`}>
                    {t.description}
                  </span>
                </div>
                {t.priority && (
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    t.priority === 'high' ? 'bg-[#FB7185]/20 text-[#FB7185]' :
                    t.priority === 'medium' ? 'bg-[#FBBF24]/20 text-[#FBBF24]' :
                    'bg-[#22D3EE]/20 text-[#22D3EE]'
                  }`}>
                    {t.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Clock } from 'lucide-react';

export default function TimeReports({ tasks, timeEntries }: { tasks: any[], timeEntries: any[] }) {
  const chartData = useMemo(() => {
    const taskTime: Record<string, number> = {};
    
    const getSeconds = (val: any): number => {
      if (!val) return 0;
      if (typeof val.seconds === 'number') return val.seconds;
      if (typeof val.toDate === 'function') return Math.floor(val.toDate().getTime() / 1000);
      if (val instanceof Date) return Math.floor(val.getTime() / 1000);
      const parsed = new Date(val).getTime();
      return isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
    };

    timeEntries.forEach(entry => {
      if (entry.endTime && entry.startTime) {
        const startSec = getSeconds(entry.startTime);
        const endSec = getSeconds(entry.endTime);
        if (endSec > startSec) {
          const duration = (endSec - startSec) / 3600; // in hours
          const task = tasks.find(t => t.id === entry.taskId);
          if (task) {
            const name = task.description || 'Unnamed Task';
            taskTime[name] = (taskTime[name] || 0) + duration;
          }
        }
      }
    });
    
    return Object.entries(taskTime).map(([name, hours]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '…' : name,
      hours: parseFloat(hours.toFixed(2))
    })).sort((a, b) => b.hours - a.hours).slice(0, 6);
  }, [tasks, timeEntries]);

  return (
    <div className="bg-[#121A2E] p-6 rounded-2xl shadow-xl border border-[#1E293B] text-[#F8FAFC]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
          <Clock size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Deep Work Allocation</h2>
          <p className="text-xs text-[#94A3B8]">Hours logged in focused execution</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-xs text-[#94A3B8] border border-dashed border-[#1E293B] rounded-xl bg-[#0B1020]/50">
          <Clock size={24} className="text-[#22D3EE] mb-2 opacity-50" />
          <span>No tracked focus sessions yet. Click "Track" on any task to start.</span>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18223A', 
                  borderColor: '#1E293B', 
                  borderRadius: '12px',
                  color: '#F8FAFC'
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="hours" fill="#22D3EE" radius={[6, 6, 0, 0]} name="Hours Tracked" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

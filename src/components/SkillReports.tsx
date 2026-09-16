import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Award } from 'lucide-react';

export default function SkillReports({ tasks }: { tasks: any[] }) {
  const chartData = useMemo(() => {
    const skillStats: Record<string, number> = {};
    
    tasks.forEach(task => {
      if (task.skills && Array.isArray(task.skills)) {
        task.skills.forEach((skill: string) => {
          if (skill.trim()) {
            skillStats[skill.trim()] = (skillStats[skill.trim()] || 0) + 1;
          }
        });
      }
    });
    
    return Object.entries(skillStats).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [tasks]);

  return (
    <div className="bg-[#121A2E] p-6 rounded-2xl shadow-xl border border-[#1E293B] text-[#F8FAFC]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#7C5CFC]/30 flex items-center justify-center text-[#7C5CFC]">
          <Award size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Skill Development</h2>
          <p className="text-xs text-[#94A3B8]">Competencies strengthened across tasks</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-xs text-[#94A3B8] border border-dashed border-[#1E293B] rounded-xl bg-[#0B1020]/50">
          <Award size={24} className="text-[#7C5CFC] mb-2 opacity-50" />
          <span>No skill tags added yet. Add comma-separated skills when creating tasks!</span>
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
              <Bar dataKey="count" fill="#7C5CFC" radius={[6, 6, 0, 0]} name="Completed Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

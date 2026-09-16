import { useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { DollarSign } from 'lucide-react';

export default function FinancialInsights({ expenses, income }: { expenses: any[], income: any[] }) {
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { rawMonth: string, month: string, income: number, expense: number }> = {};
    
    const getSafeMonthKey = (dateStr?: string) => {
      if (dateStr && typeof dateStr === 'string' && dateStr.length >= 7) {
        const candidate = dateStr.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(candidate)) {
          return candidate;
        }
      }
      return format(new Date(), 'yyyy-MM');
    };

    const getMonthLabel = (monthKey: string) => {
      try {
        const parsed = parseISO(`${monthKey}-01`);
        if (isValid(parsed)) {
          return format(parsed, 'MMM yy');
        }
      } catch {
        // Fallback
      }
      return monthKey;
    };

    [...income].forEach(i => {
      const month = getSafeMonthKey(i.date);
      if (!monthlyData[month]) monthlyData[month] = { rawMonth: month, month: getMonthLabel(month), income: 0, expense: 0 };
      monthlyData[month].income += (Number(i.amount) || 0);
    });
    
    [...expenses].forEach(e => {
      const month = getSafeMonthKey(e.date);
      if (!monthlyData[month]) monthlyData[month] = { rawMonth: month, month: getMonthLabel(month), income: 0, expense: 0 };
      monthlyData[month].expense += (Number(e.amount) || 0);
    });

    return Object.values(monthlyData).sort((a, b) => a.rawMonth.localeCompare(b.rawMonth));
  }, [expenses, income]);

  return (
    <div className="bg-[#121A2E] p-6 rounded-2xl shadow-xl border border-[#1E293B] text-[#F8FAFC]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#34D399]/30 flex items-center justify-center text-[#34D399]">
          <DollarSign size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Financial Analytics (Income vs Expenses)</h2>
          <p className="text-xs text-[#94A3B8]">Flow of financial resources in RWF</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18223A', 
                borderColor: '#1E293B', 
                borderRadius: '12px',
                color: '#F8FAFC',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }} 
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="income" fill="#34D399" radius={[6, 6, 0, 0]} name="Income" />
            <Bar dataKey="expense" fill="#FB7185" radius={[6, 6, 0, 0]} name="Expense" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

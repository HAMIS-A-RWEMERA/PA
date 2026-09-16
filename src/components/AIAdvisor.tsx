import { useState } from 'react';
import { auth } from '../lib/firebase';
import { Sparkles, Bot, AlertCircle } from 'lucide-react';

export default function AIAdvisor() {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ userId: auth.currentUser.uid }),
      });
      const data = await response.json();
      if (response.status === 429) {
        setAdvice('You have exceeded your API usage limit. Please wait a moment before trying again.');
      } else {
        setAdvice(data.advice);
      }
    } catch {
      setAdvice('Unable to connect to the advisor service right now. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121A2E] p-6 rounded-2xl shadow-xl border border-[#1E293B] text-[#F8FAFC] flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#7C5CFC]/40 flex items-center justify-center text-[#7C5CFC]">
            <Sparkles size={20} className="text-[#22D3EE]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">AI Strategic Advisor</h2>
            <p className="text-xs text-[#94A3B8]">Synthesized guidance on goals, time & growth</p>
          </div>
        </div>

        <button 
          onClick={getAdvice} 
          className="w-full sm:w-auto px-5 py-2.5 bg-[#7C5CFC] hover:bg-[#6844F7] text-[#F8FAFC] text-xs font-semibold rounded-xl shadow-lg shadow-[#7C5CFC]/20 transition flex items-center justify-center gap-2 mb-4 disabled:opacity-50 cursor-pointer" 
          disabled={loading}
        >
          <Sparkles size={14} />
          <span>{loading ? 'Analyzing your progress...' : 'Generate Strategic Insights'}</span>
        </button>

        {advice && (
          <div className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B] text-xs leading-relaxed text-[#F8FAFC] whitespace-pre-wrap">
            {advice}
          </div>
        )}

        {!advice && !loading && (
          <div className="p-4 rounded-xl border border-dashed border-[#1E293B] bg-[#0B1020]/40 text-xs text-[#94A3B8] text-center">
            Click above to synthesize your task patterns, time logs, and goals into actionable guidance.
          </div>
        )}
      </div>
    </div>
  );
}

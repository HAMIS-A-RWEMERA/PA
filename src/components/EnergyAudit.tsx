import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, where, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { BatteryCharging, BatteryWarning, Sparkles, Check, HeartPulse } from 'lucide-react';

const COMMON_TAGS = [
  'Deep Night Focus',
  'Coding Flow',
  'Debate / Discussion',
  'Mentoring / Teaching',
  'Reading & Research',
  'Walking / Nature',
  'Full Sleep / Rest',
  'Too Many Priorities',
  'Interruption Heavy',
  'Digital Detox',
];

export default function EnergyAudit() {
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [justLogged, setJustLogged] = useState<boolean>(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) {
        setRecentLogs([]);
        return;
      }
      const q = query(
        collection(db, 'energyLogs'),
        where('userId', '==', user.uid),
        limit(7)
      );

      unsubscribeSnapshot = onSnapshot(
        q, 
        (snapshot) => {
          const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort client-side by timestamp or date if available
          logs.sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
          setRecentLogs(logs);
        },
        (error) => {
          console.warn('Energy logs listener note:', error);
        }
      );
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'energyLogs'), {
        userId: auth.currentUser.uid,
        energyLevel,
        tags: selectedTags,
        notes: notes.trim(),
        date: format(new Date(), 'yyyy-MM-dd'),
        createdAt: serverTimestamp(),
      });
      setJustLogged(true);
      setNotes('');
      setSelectedTags([]);
      setTimeout(() => setJustLogged(false), 3000);
    } catch (err) {
      console.error('Error logging energy:', err);
    } finally {
      setSaving(false);
    }
  };

  const getEnergyColor = (val: number) => {
    if (val >= 8) return 'text-[#34D399]';
    if (val >= 5) return 'text-[#22D3EE]';
    if (val >= 3) return 'text-[#FBBF24]';
    return 'text-[#FB7185]';
  };

  return (
    <div className="bg-[#121A2E] p-6 rounded-2xl shadow-xl border border-[#1E293B] mt-8 text-[#F8FAFC]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#7C5CFC]/30 flex items-center justify-center text-[#7C5CFC]">
            <HeartPulse size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">Energy & Recharge Audit</h2>
            <p className="text-xs text-[#94A3B8]">
              Discovering what restores vs. depletes you from genuine evidence
            </p>
          </div>
        </div>

        {recentLogs.length > 0 && (
          <div className="flex items-center gap-2 text-xs bg-[#18223A] px-3 py-1.5 rounded-lg border border-[#1E293B]">
            <span className="text-[#94A3B8]">Recent Avg:</span>
            <span className="font-bold text-[#22D3EE]">
              {(recentLogs.reduce((acc, l) => acc + (l.energyLevel || 0), 0) / recentLogs.length).toFixed(1)} / 10
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Slider */}
        <div className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-[#94A3B8]">Current Energy / Clarity</span>
            <span className={`text-xl font-extrabold ${getEnergyColor(energyLevel)}`}>
              {energyLevel} <span className="text-xs font-normal text-[#94A3B8]">/ 10</span>
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-[#0B1020] rounded-lg appearance-none cursor-pointer accent-[#7C5CFC]"
          />
          <div className="flex justify-between text-[11px] text-[#94A3B8] mt-1.5">
            <span className="text-[#FB7185]">1 - Drained / Exhausted</span>
            <span className="text-[#FBBF24]">5 - Neutral</span>
            <span className="text-[#34D399]">10 - Restored & Energized</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
            Recharge & Depletion Factors (Select all that applied today)
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map(tag => {
              const selected = selectedTags.includes(tag);
              const isNegative = tag.includes('Too') || tag.includes('Interruption');
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                    selected
                      ? isNegative
                        ? 'bg-[#FB7185]/20 border-[#FB7185] text-[#FB7185]'
                        : 'bg-[#7C5CFC]/25 border-[#7C5CFC] text-[#F8FAFC]'
                      : 'bg-[#18223A] border-[#1E293B] text-[#94A3B8] hover:border-[#7C5CFC]/40 hover:text-[#F8FAFC]'
                  }`}
                >
                  {selected && <Check size={12} className={isNegative ? 'text-[#FB7185]' : 'text-[#22D3EE]'} />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wider">
            Observation / Honest Reflection
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., 3 quiet hours of coding at night felt deeply restoring; afternoon calls fragmented focus."
            className="w-full bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl p-3 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#7C5CFC] hover:bg-[#6844F7] text-[#F8FAFC] font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-[#7C5CFC]/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span>Recording...</span>
            ) : justLogged ? (
              <>
                <Check size={16} className="text-[#34D399]" />
                <span>Recorded! Updating patterns...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-[#22D3EE]" />
                <span>Log Energy Check-in</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Recent Entries */}
      {recentLogs.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[#1E293B]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">
            Recent Check-ins
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {recentLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="bg-[#18223A] p-3 rounded-xl border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-xs bg-[#0B1020] ${getEnergyColor(
                      log.energyLevel
                    )}`}
                  >
                    {log.energyLevel}/10
                  </span>
                  <span className="text-[#94A3B8]">{log.date}</span>
                  {log.notes && (
                    <span className="text-[#F8FAFC] italic truncate max-w-xs">
                      "{log.notes}"
                    </span>
                  )}
                </div>
                {log.tags && log.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {log.tags.map((t: string) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#0B1020] text-[#22D3EE] border border-[#1E293B]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

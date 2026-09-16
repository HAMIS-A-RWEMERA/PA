/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import EntryForm from './components/EntryForm';
import QuickCaptureBar from './components/QuickCaptureBar';
import AIAdvisor from './components/AIAdvisor';
import CalendarView from './components/CalendarView';
import KanbanBoard from './components/KanbanBoard';
import TimeReports from './components/TimeReports';
import SkillReports from './components/SkillReports';
import FinancialInsights from './components/FinancialInsights';
import Chatbot from './components/Chatbot';
import EnergyAudit from './components/EnergyAudit';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TaskColor } from './types';
import { Moon, Sun, Shield, LogOut, CheckCircle2, TrendingUp, TrendingDown, Target, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskItem {
  id: string;
  description: string;
  completed?: boolean;
  onToggle?: () => void;
  type?: 'expense' | 'income' | 'goal';
  meta?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isDeepWorkMode, setIsDeepWorkMode] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const qTasks = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubscribeTasks = onSnapshot(
      qTasks, 
      (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.warn('Tasks listener note:', error);
      }
    );

    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const unsubscribeExpenses = onSnapshot(
      qExpenses, 
      (snapshot) => {
        setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.warn('Expenses listener note:', error);
      }
    );

    const qIncome = query(collection(db, 'income'), where('userId', '==', user.uid));
    const unsubscribeIncome = onSnapshot(
      qIncome, 
      (snapshot) => {
        setIncome(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.warn('Income listener note:', error);
      }
    );

    const qGoals = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const unsubscribeGoals = onSnapshot(
      qGoals, 
      (snapshot) => {
        setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.warn('Goals listener note:', error);
      }
    );

    const qTimeEntries = query(collection(db, 'timeEntries'), where('userId', '==', user.uid));
    const unsubscribeTimeEntries = onSnapshot(
      qTimeEntries, 
      (snapshot) => {
        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTimeEntries(entries);
        const running = entries.find((e: any) => !e.endTime);
        if (running) {
          setActiveTaskId((running as any).taskId);
        } else {
          setActiveTaskId(null);
        }
      },
      (error) => {
        console.warn('Time entries listener note:', error);
      }
    );

    return () => { 
      unsubscribeTasks(); 
      unsubscribeExpenses(); 
      unsubscribeIncome(); 
      unsubscribeGoals(); 
      unsubscribeTimeEntries(); 
    };
  }, [user]);

  const toggleTask = async (id: string, completed: boolean, reflection?: string) => {
    const taskRef = doc(db, 'tasks', id);
    const updateData: any = { completed: !completed };
    if (reflection) {
      updateData.reflection = reflection;
    }
    await updateDoc(taskRef, updateData);
  };

  const togglePinTask = async (id: string, currentPinned: boolean) => {
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, { pinned: !currentPinned });
  };

  const updateTaskColor = async (id: string, color: TaskColor) => {
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, { color });
  };

  const toggleSubtask = async (id: string, subtaskIndex: number) => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask || !targetTask.subtasks) return;
    const updatedSubtasks = [...targetTask.subtasks];
    if (updatedSubtasks[subtaskIndex]) {
      updatedSubtasks[subtaskIndex] = {
        ...updatedSubtasks[subtaskIndex],
        completed: !updatedSubtasks[subtaskIndex].completed
      };
      await updateDoc(doc(db, 'tasks', id), { subtasks: updatedSubtasks });
    }
  };

  const addSubtask = async (id: string, text: string) => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;
    const currentSubtasks = targetTask.subtasks || [];
    const newSub = { id: Date.now().toString(), text, completed: false };
    await updateDoc(doc(db, 'tasks', id), { subtasks: [...currentSubtasks, newSub] });
  };

  const deleteSubtask = async (id: string, subtaskIndex: number) => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask || !targetTask.subtasks) return;
    const updatedSubtasks = targetTask.subtasks.filter((_: any, idx: number) => idx !== subtaskIndex);
    await updateDoc(doc(db, 'tasks', id), { subtasks: updatedSubtasks });
  };

  const toggleArchiveTask = async (id: string, currentArchived: boolean) => {
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, { isArchived: !currentArchived });
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  const startTimer = async (taskId: string) => {
    if (!user) return;
    const runningEntries = timeEntries.filter(e => !e.endTime);
    for (const openEntry of runningEntries) {
      await updateDoc(doc(db, 'timeEntries', openEntry.id), {
        endTime: serverTimestamp()
      });
    }
    await addDoc(collection(db, 'timeEntries'), {
      userId: user.uid,
      taskId,
      startTime: serverTimestamp(),
      endTime: null
    });
    setActiveTaskId(taskId);
  };

  const stopTimer = async (taskId: string) => {
    const entry = timeEntries.find(e => e.taskId === taskId && !e.endTime);
    if (entry) {
      await updateDoc(doc(db, 'timeEntries', entry.id), {
        endTime: serverTimestamp()
      });
    }
    setActiveTaskId(null);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B1020] text-[#F8FAFC] p-6 relative overflow-hidden">
        {/* Ambient subtle glow background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7C5CFC]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#121A2E] p-8 rounded-3xl border border-[#1E293B] shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#18223A] border border-[#7C5CFC]/40 mx-auto mb-5 flex items-center justify-center text-[#7C5CFC] shadow-lg shadow-[#7C5CFC]/20">
            <Shield size={32} className="text-[#22D3EE]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] mb-2">Personal Assistant</h1>
          <p className="text-sm text-[#94A3B8] mb-8 leading-relaxed">
            Your dedicated workspace for intentional growth, deep work, reflections, skills, and energy management.
          </p>

          <button 
            onClick={signInWithGoogle}
            className="w-full py-3.5 px-6 bg-[#7C5CFC] hover:bg-[#6844F7] text-[#F8FAFC] font-semibold rounded-xl transition shadow-lg shadow-[#7C5CFC]/25 flex items-center justify-center gap-3 border border-[#9075FF]/30 active:scale-95 cursor-pointer text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.9 7.5 23.5 12 23.5z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="mt-8 pt-6 border-t border-[#1E293B] grid grid-cols-3 gap-2 text-center text-[11px] text-[#94A3B8]">
            <div>
              <span className="block font-bold text-[#F8FAFC]">Sanctuary</span>
              <span>Zero Noise</span>
            </div>
            <div>
              <span className="block font-bold text-[#22D3EE]">Offline First</span>
              <span>Auto Sync</span>
            </div>
            <div>
              <span className="block font-bold text-[#34D399]">Holistic</span>
              <span>Energy & Skills</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC] transition-colors duration-300">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0B1020]/90 backdrop-blur-md border-b border-[#1E293B] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#121A2E] border border-[#7C5CFC]/40 flex items-center justify-center text-[#7C5CFC] shadow-sm shadow-[#7C5CFC]/20">
              <Shield size={20} className="text-[#22D3EE]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Personal Assistant</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#18223A] text-[#7C5CFC] border border-[#7C5CFC]/30">
                  Pro
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] hidden sm:block">
                Values • Energy • Competence • Impact
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <PWAInstallButton />

            <button 
              onClick={() => setIsDeepWorkMode(!isDeepWorkMode)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                isDeepWorkMode 
                  ? 'bg-[#FBBF24]/15 border-[#FBBF24] text-[#FBBF24] shadow-lg shadow-[#FBBF24]/10' 
                  : 'bg-[#18223A] border-[#1E293B] text-[#94A3B8] hover:border-[#7C5CFC]/50 hover:text-[#F8FAFC]'
              }`}
              title="Toggle Sanctuary Mode for deep distraction-free concentration"
            >
              <Moon size={14} className={isDeepWorkMode ? 'text-[#FBBF24]' : 'text-[#7C5CFC]'} />
              <span>{isDeepWorkMode ? 'Exit Sanctuary' : 'The Sanctuary'}</span>
            </button>

            <button 
              onClick={() => signOut(auth)} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#18223A] text-[#FB7185] hover:bg-[#FB7185]/10 border border-[#1E293B] hover:border-[#FB7185]/40 transition cursor-pointer"
              title="Sign out of your account"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        {isDeepWorkMode ? (
          /* Sanctuary Mode (Deep Focus, Environmental Isolation) */
          <div className="flex flex-col items-center justify-center min-h-[75vh] relative py-12">
            <div className="absolute w-96 h-96 bg-[#7C5CFC]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-full max-w-xl bg-[#121A2E] p-8 sm:p-10 rounded-3xl shadow-2xl border border-[#1E293B] text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18223A] border border-[#FBBF24]/40 text-[#FBBF24] text-xs font-semibold mb-6">
                <Moon size={13} />
                <span>Sanctuary Active — Environmental Isolation</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] mb-2 tracking-tight">
                Single Point of Focus
              </h2>
              <p className="text-xs sm:text-sm text-[#94A3B8] mb-8 max-w-md mx-auto leading-relaxed">
                All metrics, notifications, and competing priorities are muted. What matters is right here.
              </p>

              <div className="bg-[#18223A] p-6 rounded-2xl border border-[#7C5CFC]/30 mb-8 shadow-inner">
                <span className="text-xs uppercase tracking-wider text-[#94A3B8] block mb-2 font-semibold">
                  Current Target
                </span>
                <p className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
                  {activeTask ? activeTask.description : 'No timer currently running'}
                </p>
                {activeTask && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C5CFC]/20 text-[#22D3EE] text-xs font-mono font-medium">
                      <Clock size={13} />
                      <span>Tracking focus</span>
                    </span>
                    <button
                      onClick={() => stopTimer(activeTask.id)}
                      className="px-3.5 py-1 rounded-full bg-[#FB7185]/20 hover:bg-[#FB7185]/30 text-[#FB7185] border border-[#FB7185]/30 text-xs font-semibold transition cursor-pointer"
                    >
                      Stop Timer
                    </button>
                  </div>
                )}
                {!activeTask && (
                  <p className="text-xs text-[#94A3B8] mt-3">
                    Tip: Start a timer from any task on your Kanban board before entering Sanctuary.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsDeepWorkMode(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#18223A] hover:bg-[#1E293B] text-xs font-semibold text-[#F8FAFC] border border-[#1E293B] transition cursor-pointer"
                >
                  Return to Full Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Full Comprehensive Dashboard */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#121A2E] p-4 rounded-2xl border border-[#1E293B] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#7C5CFC]/30 flex items-center justify-center text-[#7C5CFC]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-xs text-[#94A3B8] font-medium">Active Tasks</div>
                  <div className="text-xl font-bold text-[#F8FAFC]">{tasks.filter(t => !t.completed && !t.isArchived).length}</div>
                </div>
              </div>

              <div className="bg-[#121A2E] p-4 rounded-2xl border border-[#1E293B] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#34D399]/30 flex items-center justify-center text-[#34D399]">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="text-xs text-[#94A3B8] font-medium">Total Income</div>
                  <div className="text-xl font-bold text-[#34D399]">
                    {income.reduce((acc, i) => acc + (Number(i.amount) || 0), 0).toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">RWF</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#121A2E] p-4 rounded-2xl border border-[#1E293B] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#FB7185]/30 flex items-center justify-center text-[#FB7185]">
                  <TrendingDown size={18} />
                </div>
                <div>
                  <div className="text-xs text-[#94A3B8] font-medium">Total Expenses</div>
                  <div className="text-xl font-bold text-[#FB7185]">
                    {expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0).toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">RWF</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#121A2E] p-4 rounded-2xl border border-[#1E293B] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
                  <Target size={18} />
                </div>
                <div>
                  <div className="text-xs text-[#94A3B8] font-medium">Active Goals</div>
                  <div className="text-xl font-bold text-[#22D3EE]">{goals.length}</div>
                </div>
              </div>
            </div>

            {/* Google Keep Quick Capture Bar */}
            <QuickCaptureBar goals={goals} />

            {/* Structured Multi-Field Entry Drawer Toggle */}
            <div className="flex justify-end -mt-2 mb-2">
              <button
                type="button"
                onClick={() => setShowDetailedForm(!showDetailedForm)}
                className="text-xs text-[#94A3B8] hover:text-[#7C5CFC] transition inline-flex items-center gap-1 cursor-pointer bg-[#121A2E] px-3 py-1.5 rounded-xl border border-[#1E293B]"
              >
                <span>{showDetailedForm ? 'Hide structured form' : 'Open structured entry form'}</span>
                {showDetailedForm ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {showDetailedForm && (
              <div className="mb-4">
                <EntryForm onAdded={() => setShowDetailedForm(false)} goals={goals} />
              </div>
            )}

            {/* Core Workspace Grid: Kanban & Quick Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-[#121A2E] p-6 rounded-2xl shadow-sm border border-[#1E293B]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-[#F8FAFC]">Task Board</h2>
                      <p className="text-xs text-[#94A3B8]">With Google Keep organization, pin priority, color coding, subtasks & reflections</p>
                    </div>
                  </div>
                  <KanbanBoard 
                    tasks={tasks} 
                    goals={goals} 
                    onToggle={toggleTask} 
                    onStartTimer={startTimer} 
                    onStopTimer={stopTimer} 
                    activeTaskId={activeTaskId} 
                    onTogglePin={togglePinTask}
                    onUpdateColor={updateTaskColor}
                    onToggleSubtask={toggleSubtask}
                    onAddSubtask={addSubtask}
                    onDeleteSubtask={deleteSubtask}
                    onToggleArchive={toggleArchiveTask}
                    onDeleteTask={deleteTask}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <Section 
                  title="Expenses" 
                  items={expenses.map(e => ({
                    id: e.id, 
                    description: `${e.category || 'Expense'}: ${Number(e.amount).toLocaleString()} RWF`,
                    type: 'expense' as const,
                    meta: e.date || 'No date'
                  }))} 
                  badgeColor="text-[#FB7185]"
                />

                <Section 
                  title="Income" 
                  items={income.map(i => ({
                    id: i.id, 
                    description: `${i.category || 'Income'}: ${Number(i.amount).toLocaleString()} RWF`,
                    type: 'income' as const,
                    meta: i.date || 'No date'
                  }))} 
                  badgeColor="text-[#34D399]"
                />

                <Section 
                  title="Active Goals" 
                  items={goals.map(g => ({
                    id: g.id, 
                    description: `${g.goalDescription}: ${g.target}`,
                    type: 'goal' as const,
                    meta: g.date || 'Ongoing'
                  }))} 
                  badgeColor="text-[#22D3EE]"
                />
              </div>
            </div>

            {/* Energy & Recharge Audit (Holistic Wellness) */}
            <EnergyAudit />

            {/* Analytics & Insight Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TimeReports tasks={tasks} timeEntries={timeEntries} />
              <SkillReports tasks={tasks} />
            </div>

            <FinancialInsights expenses={expenses} income={income} />

            {/* Calendar & Scheduling */}
            <CalendarView tasks={tasks} />

            {/* AI Advisor & Assistant */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AIAdvisor />
              <Chatbot />
            </div>
          </div>
        )}
      </main>

      {/* Offline Status Badge */}
      <OfflineIndicator />
    </div>
  );
}

function Section({ 
  title, 
  items, 
  badgeColor = 'text-[#22D3EE]' 
}: { 
  title: string; 
  items: TaskItem[]; 
  badgeColor?: string;
}) {
  return (
    <div className="bg-[#121A2E] p-5 rounded-2xl shadow-sm border border-[#1E293B]">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-base font-bold text-[#F8FAFC]">{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#18223A] text-[#94A3B8] border border-[#1E293B]">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-[#94A3B8] py-4 text-center bg-[#18223A]/50 rounded-xl border border-dashed border-[#1E293B]">
          No entries recorded yet
        </div>
      ) : (
        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {items.map(item => (
            <li 
              key={item.id} 
              className="bg-[#18223A] hover:bg-[#1C2844] p-2.5 rounded-xl border border-[#1E293B] flex items-center justify-between gap-2 text-xs transition"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {item.onToggle && (
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={item.onToggle}
                    className="w-4 h-4 rounded border-[#1E293B] bg-[#0B1020] text-[#7C5CFC] focus:ring-[#7C5CFC] cursor-pointer"
                  />
                )}
                <span className={`truncate ${item.completed ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'}`}>
                  {item.description}
                </span>
              </div>
              {item.meta && (
                <span className={`text-[11px] font-mono whitespace-nowrap ${badgeColor}`}>
                  {item.meta}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

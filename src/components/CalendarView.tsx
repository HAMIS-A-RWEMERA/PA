import { useState, useEffect, useRef } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths
} from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  CalendarDays,
  Upload,
  Download,
  Bell,
  BellRing,
  ExternalLink,
  HelpCircle,
  X,
  Plus,
  Trash2,
  MapPin,
  CalendarCheck,
  RefreshCw,
  AlertTriangle,
  Send,
  Volume2,
  Check
} from 'lucide-react';
import { db, auth, getAccessToken, connectGoogleCalendar } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { CalendarEvent } from '../types';

interface CalendarViewProps {
  tasks: any[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Google Calendar API states
  const [isSyncingGoogleCal, setIsSyncingGoogleCal] = useState(false);
  const [googleCalSyncMsg, setGoogleCalSyncMsg] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // User Confirmation Modal (MANDATORY for Workspace mutating operations)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionText: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const today = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0 for Sunday

  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const activeTasks = tasks.filter(t => !t.isArchived);
  const selectedDayTasks = activeTasks.filter(t => t.date === selectedDayStr);
  const selectedDayEvents = calendarEvents.filter(e => e.startDate?.startsWith(selectedDayStr));

  // Sync calendar_events from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'calendar_events'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CalendarEvent[];
      setCalendarEvents(events);
    }, (err) => {
      console.warn('Calendar events listener error:', err);
    });

    return () => unsubscribe();
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Check if access token is available in memory to show connected status
  useEffect(() => {
    getAccessToken().then(tok => {
      if (tok) setIsGoogleConnected(true);
    });
  }, []);

  // Periodic reminder checking for scheduled tasks and events
  useEffect(() => {
    if (!notificationsEnabled) return;
    const checkUpcoming = () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const dueToday = activeTasks.filter(t => t.date === todayStr && !t.completed);
      const eventsToday = calendarEvents.filter(e => e.startDate?.startsWith(todayStr));
      
      if (dueToday.length > 0 || eventsToday.length > 0) {
        // Desktop notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          const count = dueToday.length + eventsToday.length;
          new Notification(`Life Assistant Reminder (${count} item${count === 1 ? '' : 's'})`, {
            body: `You have ${dueToday.length} task(s) and ${eventsToday.length} calendar event(s) scheduled for today.`,
            icon: '/favicon.ico'
          });
        }
      }
    };

    // Run once on load and check every 15 minutes
    const timer = setInterval(checkUpcoming, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [notificationsEnabled, activeTasks, calendarEvents]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support desktop notifications.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotificationsEnabled(true);
      new Notification('Life Assistant Reminders Active', {
        body: 'You will now receive proactive reminders for your scheduled tasks and Google Calendar events.',
        icon: '/favicon.ico'
      });
      playChime();
    }
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      // AudioContext unavailable or blocked
    }
  };

  // Live Google Calendar API sync
  const handleSyncGoogleCalendar = async () => {
    if (!auth.currentUser) return;
    setIsSyncingGoogleCal(true);
    setGoogleCalSyncMsg('Connecting to Google Calendar...');
    try {
      let token = await getAccessToken();
      if (!token) {
        token = await connectGoogleCalendar();
      }
      if (!token) {
        setGoogleCalSyncMsg('Google Calendar connection required. Please grant permission.');
        setIsSyncingGoogleCal(false);
        return;
      }
      setIsGoogleConnected(true);

      setGoogleCalSyncMsg('Syncing Google Calendar events...');
      // 2-month window: start of current month minus 1 month to end of current month plus 1 month
      const timeMin = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0).toISOString();

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setIsGoogleConnected(false);
          setGoogleCalSyncMsg('Session expired. Please click "Sync Google Calendar" to re-authorize.');
          return;
        }
        throw new Error(`Google Calendar API responded with status ${res.status}`);
      }

      const data = await res.json();
      const items = data.items || [];
      let addedCount = 0;

      for (const item of items) {
        const start = item.start?.dateTime || item.start?.date;
        const end = item.end?.dateTime || item.end?.date;
        const title = item.summary || 'Untitled Event';
        
        // Avoid duplicate insertion
        const existing = calendarEvents.find(e => (e as any).googleEventId === item.id);
        if (!existing && start) {
          await addDoc(collection(db, 'calendar_events'), {
            userId: auth.currentUser.uid,
            title,
            description: item.description || '',
            location: item.location || '',
            startDate: start,
            endDate: end,
            source: 'google_api',
            googleEventId: item.id,
            htmlLink: item.htmlLink || '',
            createdAt: new Date().toISOString()
          });
          addedCount++;
        }
      }

      setLastSyncedTime(format(new Date(), 'HH:mm:ss'));
      setGoogleCalSyncMsg(`Successfully synced ${items.length} Google events (${addedCount} new added)!`);
      playChime();
      setTimeout(() => setGoogleCalSyncMsg(null), 4000);
    } catch (err: any) {
      console.error('Google Calendar sync error:', err);
      setGoogleCalSyncMsg(`Sync notice: ${err.message || 'Network error'}. You can also attach a .ics file anytime.`);
    } finally {
      setIsSyncingGoogleCal(false);
    }
  };

  // Push task as a real event to Google Calendar (with mandatory confirmation)
  const handleRequestPushTaskToGoogleCalendar = (task: any) => {
    const taskDate = task.date || format(new Date(), 'yyyy-MM-dd');
    setConfirmModal({
      isOpen: true,
      title: 'Push Task to Google Calendar',
      description: `Create an event in your Google Calendar for "${task.description}" scheduled on ${taskDate}?`,
      actionText: 'Confirm & Add to Google Calendar',
      onConfirm: async () => {
        try {
          let token = await getAccessToken();
          if (!token) {
            token = await connectGoogleCalendar();
          }
          if (!token) {
            alert('Google Calendar access token needed. Please sign in.');
            return;
          }

          const eventBody = {
            summary: task.description,
            description: `Priority: ${task.priority || 'Normal'}\nCreated via RWEMERA Life Assistant Hub\nSkills: ${(task.skills || []).join(', ')}`,
            start: {
              date: taskDate
            },
            end: {
              date: taskDate
            }
          };

          const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventBody)
          });

          if (res.ok) {
            const created = await res.json();
            if (auth.currentUser) {
              await addDoc(collection(db, 'calendar_events'), {
                userId: auth.currentUser.uid,
                title: task.description,
                startDate: taskDate,
                endDate: taskDate,
                source: 'google_api',
                googleEventId: created.id,
                htmlLink: created.htmlLink || '',
                createdAt: new Date().toISOString()
              });
            }
            setGoogleCalSyncMsg('Event created in your Google Calendar!');
            playChime();
            setTimeout(() => setGoogleCalSyncMsg(null), 3500);
          } else {
            throw new Error(`Google Calendar API returned status ${res.status}`);
          }
        } catch (e: any) {
          console.error('Error adding event to Google Calendar:', e);
          setGoogleCalSyncMsg(`Error: ${e.message}`);
        }
      }
    });
  };

  // Delete event (with mandatory confirmation)
  const handleRequestDeleteEvent = (event: CalendarEvent) => {
    const isGoogleApiEvent = (event as any).source === 'google_api' && (event as any).googleEventId;

    setConfirmModal({
      isOpen: true,
      title: isGoogleApiEvent ? 'Delete Event from Google Calendar' : 'Delete Calendar Event',
      description: isGoogleApiEvent 
        ? `Are you sure you want to delete "${event.title}" from your Google Calendar and this view? This action cannot be undone.`
        : `Remove "${event.title}" from your assistant calendar?`,
      actionText: 'Delete Event',
      isDestructive: true,
      onConfirm: async () => {
        try {
          if (isGoogleApiEvent) {
            const token = await getAccessToken();
            if (token) {
              await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${(event as any).googleEventId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
            }
          }
          await deleteDoc(doc(db, 'calendar_events', event.id));
          setGoogleCalSyncMsg('Event removed.');
          setTimeout(() => setGoogleCalSyncMsg(null), 2500);
        } catch (err: any) {
          console.error('Delete error:', err);
        }
      }
    });
  };

  // Parse iCalendar (.ics) format
  const parseICS = (icsText: string): Omit<CalendarEvent, 'id' | 'userId'>[] => {
    const events: Omit<CalendarEvent, 'id' | 'userId'>[] = [];
    const lines = icsText.split(/\r\n|\n|\r/);
    let inEvent = false;
    let currentEvent: any = {};

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        line += lines[i + 1].slice(1);
        i++;
      }

      if (line.startsWith('BEGIN:VEVENT')) {
        inEvent = true;
        currentEvent = { source: 'ical_import' };
      } else if (line.startsWith('END:VEVENT')) {
        inEvent = false;
        if (currentEvent.title && currentEvent.startDate) {
          events.push(currentEvent);
        }
      } else if (inEvent) {
        if (line.startsWith('SUMMARY:')) {
          currentEvent.title = line.substring(8).trim();
        } else if (line.startsWith('DESCRIPTION:')) {
          currentEvent.description = line.substring(12).trim().replace(/\\n/g, '\n');
        } else if (line.startsWith('LOCATION:')) {
          currentEvent.location = line.substring(9).trim();
        } else if (line.startsWith('DTSTART')) {
          const val = line.split(':')[1]?.trim();
          if (val) {
            if (val.length === 8) {
              const y = val.substring(0, 4);
              const m = val.substring(4, 6);
              const d = val.substring(6, 8);
              currentEvent.startDate = `${y}-${m}-${d}`;
            } else if (val.includes('T')) {
              const datePart = val.split('T')[0];
              const timePart = val.split('T')[1].replace('Z', '');
              const y = datePart.substring(0, 4);
              const m = datePart.substring(4, 6);
              const d = datePart.substring(6, 8);
              const hh = timePart.substring(0, 2);
              const mm = timePart.substring(2, 4);
              currentEvent.startDate = `${y}-${m}-${d}T${hh}:${mm}`;
            }
          }
        } else if (line.startsWith('DTEND')) {
          const val = line.split(':')[1]?.trim();
          if (val) {
            if (val.length === 8) {
              const y = val.substring(0, 4);
              const m = val.substring(4, 6);
              const d = val.substring(6, 8);
              currentEvent.endDate = `${y}-${m}-${d}`;
            } else if (val.includes('T')) {
              const datePart = val.split('T')[0];
              const timePart = val.split('T')[1].replace('Z', '');
              const y = datePart.substring(0, 4);
              const m = datePart.substring(4, 6);
              const d = datePart.substring(6, 8);
              const hh = timePart.substring(0, 2);
              const mm = timePart.substring(2, 4);
              currentEvent.endDate = `${y}-${m}-${d}T${hh}:${mm}`;
            }
          }
        }
      }
    }

    return events;
  };

  const handleFileUpload = async (file: File) => {
    if (!auth.currentUser) return;
    setImportStatus('Reading calendar file...');
    try {
      const text = await file.text();
      const parsed = parseICS(text);
      if (parsed.length === 0) {
        setImportStatus('No events found in this .ics file. Please verify file format.');
        return;
      }

      setImportStatus(`Importing ${parsed.length} events...`);
      for (const ev of parsed) {
        await addDoc(collection(db, 'calendar_events'), {
          ...ev,
          userId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
      }

      setImportStatus(`Successfully synced ${parsed.length} events!`);
      playChime();
      setTimeout(() => {
        setImportStatus(null);
        setShowImportBox(false);
      }, 3500);
    } catch (err) {
      console.error('ICS parse error:', err);
      setImportStatus('Error importing calendar file. Please try another .ics export.');
    }
  };

  // Reliable Export to .ics with delayed URL revocation
  const handleExportICS = () => {
    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//RWEMERA Ally Hamis Life Assistant//EN\r\nCALSCALE:GREGORIAN\r\n`;

    activeTasks.forEach((t) => {
      if (!t.date) return;
      const cleanDate = t.date.replace(/-/g, '');
      icsContent += `BEGIN:VEVENT\r\n`;
      icsContent += `SUMMARY:${t.description.replace(/\n/g, ' ')}\r\n`;
      icsContent += `DTSTART;VALUE=DATE:${cleanDate}\r\n`;
      icsContent += `DTEND;VALUE=DATE:${cleanDate}\r\n`;
      icsContent += `DESCRIPTION:Priority: ${t.priority || 'Normal'}\\nSkills: ${(t.skills || []).join(', ')}\r\n`;
      icsContent += `STATUS:${t.completed ? 'COMPLETED' : 'CONFIRMED'}\r\n`;
      icsContent += `END:VEVENT\r\n`;
    });

    calendarEvents.forEach((e) => {
      if (!e.startDate) return;
      const cleanDate = e.startDate.split('T')[0].replace(/-/g, '');
      icsContent += `BEGIN:VEVENT\r\n`;
      icsContent += `SUMMARY:${e.title.replace(/\n/g, ' ')}\r\n`;
      icsContent += `DTSTART;VALUE=DATE:${cleanDate}\r\n`;
      icsContent += `DTEND;VALUE=DATE:${cleanDate}\r\n`;
      if (e.description) icsContent += `DESCRIPTION:${e.description.replace(/\n/g, '\\n')}\r\n`;
      if (e.location) icsContent += `LOCATION:${e.location}\r\n`;
      icsContent += `END:VEVENT\r\n`;
    });

    icsContent += `END:VCALENDAR\r\n`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWEMERA_Life_Assistant_Calendar_${format(new Date(), 'yyyy-MM-dd')}.ics`;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 30000);
  };

  // Quick Add link fallback
  const openGoogleCalendarNewEvent = (title: string, dateStr: string) => {
    const cleanDate = dateStr.replace(/-/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${cleanDate}/${cleanDate}&details=${encodeURIComponent('Created via RWEMERA Life Assistant Hub')}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-[#121A2E] p-6 rounded-2xl shadow-xl border border-[#1E293B] text-[#F8FAFC]">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
            <CalendarIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#F8FAFC]">{format(currentMonth, 'MMMM yyyy')}</h2>
              {calendarEvents.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 font-mono">
                  {calendarEvents.length} Synced
                </span>
              )}
              {isGoogleConnected && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Google Connected
                </span>
              )}
            </div>
            <p className="text-xs text-[#94A3B8]">
              Monthly cadence, tasks, deadlines, live Google Calendar sync & reminders
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Google Calendar Sync Button */}
          <button
            onClick={handleSyncGoogleCalendar}
            disabled={isSyncingGoogleCal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
              isSyncingGoogleCal
                ? 'bg-[#38BDF8]/20 border-[#38BDF8]/40 text-[#38BDF8] animate-pulse'
                : 'bg-[#18223A] hover:bg-[#1E293B] border-[#38BDF8]/50 text-[#38BDF8] hover:text-white'
            }`}
            title="Fetch and sync events directly from your Google Calendar"
          >
            <RefreshCw size={13} className={isSyncingGoogleCal ? 'animate-spin' : ''} />
            <span>{isSyncingGoogleCal ? 'Syncing...' : 'Sync Google Calendar'}</span>
          </button>

          {/* Proactive Notification Reminders Toggle */}
          <button
            onClick={requestNotificationPermission}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              notificationsEnabled 
                ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]' 
                : 'bg-[#18223A] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
            title={notificationsEnabled ? 'Reminders are active' : 'Click to enable proactive reminders'}
          >
            {notificationsEnabled ? <BellRing size={13} /> : <Bell size={13} />}
            <span>{notificationsEnabled ? 'Reminders Active' : 'Enable Reminders'}</span>
          </button>

          {/* Attach / Import Google Calendar .ics */}
          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="px-3 py-1.5 rounded-xl bg-[#7C5CFC]/20 hover:bg-[#7C5CFC]/30 border border-[#7C5CFC]/40 text-xs font-semibold text-[#A78BFA] flex items-center gap-1.5 transition cursor-pointer"
            title="Attach or import your Google Calendar .ics file"
          >
            <Upload size={13} />
            <span>Attach Calendar</span>
          </button>

          {/* Guide Modal Trigger */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="p-1.5 rounded-xl bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
            title="How to download calendar from Google Calendar"
          >
            <HelpCircle size={16} />
          </button>

          {/* Export to ICS button */}
          <button
            onClick={handleExportICS}
            className="px-3 py-1.5 rounded-xl bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1.5 transition cursor-pointer"
            title="Download all scheduled items as .ics to import into Google Calendar"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export .ics</span>
          </button>

          {/* Month Navigation */}
          <div className="flex items-center gap-1 bg-[#18223A] p-1 rounded-xl border border-[#1E293B]">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-[#121A2E] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDay(new Date());
              }}
              className="px-2.5 py-1 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-[#121A2E] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
              title="Next month"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {googleCalSyncMsg && (
        <div className="mb-4 p-3 rounded-xl bg-[#18223A] border border-[#38BDF8]/40 flex items-center justify-between text-xs text-[#38BDF8] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className={isSyncingGoogleCal ? 'animate-spin' : ''} />
            <span>{googleCalSyncMsg}</span>
          </div>
          {lastSyncedTime && (
            <span className="text-[10px] text-[#94A3B8] font-mono">Last: {lastSyncedTime}</span>
          )}
        </div>
      )}

      {/* Attach / Import Drop Box */}
      {showImportBox && (
        <div className="mb-6 p-5 rounded-2xl bg-[#18223A] border border-[#7C5CFC]/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-[#7C5CFC]" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">Attach Google Calendar File (.ics)</h3>
            </div>
            <button
              onClick={() => setShowImportBox(false)}
              className="text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              isDragging 
                ? 'border-[#7C5CFC] bg-[#7C5CFC]/10' 
                : 'border-[#1E293B] hover:border-[#7C5CFC]/50 bg-[#0B1020]/40'
            }`}
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".ics,text/calendar" 
              className="hidden" 
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <CalendarCheck className="mx-auto text-[#7C5CFC] mb-2" size={28} />
            <p className="text-xs font-semibold text-[#F8FAFC]">
              Drag and drop your Google Calendar <span className="text-[#22D3EE]">.ics</span> file here, or click to browse
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Exported from Google Calendar Settings &gt; Import & Export &gt; Export.
            </p>
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#7C5CFC]/30 text-xs text-[#38BDF8] flex items-center justify-between">
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* Calendar Grid */}
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
          const dayEvents = calendarEvents.filter(e => e.startDate?.startsWith(dayStr));
          const hasTask = dayTasks.length > 0;
          const hasEvent = dayEvents.length > 0;

          return (
            <div 
              key={day.toString()} 
              onClick={() => setSelectedDay(day)}
              className={`p-1.5 sm:p-2.5 min-h-[48px] sm:min-h-[56px] rounded-xl border flex flex-col justify-between items-center transition cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[#7C5CFC] bg-[#7C5CFC]/25 border-[#7C5CFC] text-[#F8FAFC] font-bold'
                  : isToday 
                  ? 'bg-[#7C5CFC]/15 border-[#7C5CFC]/60 text-[#F8FAFC] font-semibold'
                  : (hasTask || hasEvent)
                  ? 'bg-[#18223A] border-[#22D3EE]/40 text-[#22D3EE] hover:border-[#22D3EE]' 
                  : 'bg-[#0B1020] border-[#1E293B] text-[#94A3B8] hover:border-[#1E293B]/80 hover:bg-[#121A2E]'
              }`}
            >
              <span className="text-xs font-semibold">{format(day, 'd')}</span>
              
              <div className="flex items-center gap-1 mt-1">
                {hasTask && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" title={`${dayTasks.length} tasks`} />
                )}
                {hasEvent && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" title={`${dayEvents.length} calendar events`} />
                )}
                {(dayTasks.length + dayEvents.length) > 1 && (
                  <span className="text-[9px] font-mono text-[#94A3B8] leading-none">
                    +{dayTasks.length + dayEvents.length - 1}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Agenda Drawer */}
      <div className="pt-4 border-t border-[#1E293B] mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <CalendarDays size={14} className="text-[#22D3EE]" />
            <span className="font-semibold text-[#F8FAFC]">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#18223A] text-[#94A3B8] border border-[#1E293B]">
              {selectedDayTasks.length + selectedDayEvents.length} scheduled item{selectedDayTasks.length + selectedDayEvents.length === 1 ? '' : 's'}
            </span>

            <button
              onClick={() => openGoogleCalendarNewEvent('New Focus Block', selectedDayStr)}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-[#18223A] hover:bg-[#1E293B] text-[#38BDF8] border border-[#38BDF8]/40 flex items-center gap-1 transition cursor-pointer"
              title="Add event directly to Google Calendar via Web Intent"
            >
              <Plus size={11} />
              <span>Add to Google Cal</span>
              <ExternalLink size={10} />
            </button>
          </div>
        </div>

        {selectedDayTasks.length === 0 && selectedDayEvents.length === 0 ? (
          <div className="text-center py-5 bg-[#0B1020]/40 rounded-xl border border-dashed border-[#1E293B]">
            <p className="text-xs text-[#94A3B8] italic">
              No specific deadlines or scheduled events for this date.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {/* Google Calendar Synced Events */}
            {selectedDayEvents.map(ev => (
              <div 
                key={ev.id}
                className="bg-[#18223A] p-2.5 rounded-xl border border-[#F59E0B]/30 flex items-center justify-between gap-2 text-xs relative group"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B] flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-[#F8FAFC] truncate block">{ev.title}</span>
                    <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] mt-0.5">
                      {ev.startDate?.includes('T') && (
                        <span>⏰ {ev.startDate.split('T')[1].substring(0, 5)}</span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin size={9} /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(ev as any).htmlLink ? (
                    <a
                      href={(ev as any).htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#FBBF24] hover:underline flex items-center gap-0.5"
                      title="Open in Google Calendar"
                    >
                      Google Cal <ExternalLink size={8} />
                    </a>
                  ) : (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#FBBF24]">
                      Google Cal
                    </span>
                  )}

                  <button
                    onClick={() => handleRequestDeleteEvent(ev)}
                    className="text-[#94A3B8] hover:text-[#FB7185] p-1 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Remove event"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {/* Applet Internal Scheduled Tasks */}
            {selectedDayTasks.map(t => (
              <div 
                key={t.id} 
                className="bg-[#18223A] p-2.5 rounded-xl border border-[#1E293B] flex items-center justify-between gap-2 text-xs group"
              >
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 size={14} className={t.completed ? 'text-[#34D399]' : 'text-[#94A3B8]'} />
                  <span className={`truncate ${t.completed ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'}`}>
                    {t.description}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {t.priority && (
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      t.priority === 'high' ? 'bg-[#FB7185]/20 text-[#FB7185]' :
                      t.priority === 'medium' ? 'bg-[#FBBF24]/20 text-[#FBBF24]' :
                      'bg-[#22D3EE]/20 text-[#22D3EE]'
                    }`}>
                      {t.priority}
                    </span>
                  )}

                  {/* Push to Google Calendar Button */}
                  <button
                    onClick={() => handleRequestPushTaskToGoogleCalendar(t)}
                    className="p-1 rounded text-[#38BDF8] hover:bg-[#38BDF8]/10 transition cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Push this task to your Google Calendar"
                  >
                    <Send size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step-by-Step Google Calendar Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-[#38BDF8]" size={20} />
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  How to Download & Attach your Google Calendar
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#94A3B8] leading-relaxed">
              <div className="bg-[#18223A] p-3 rounded-xl border border-[#1E293B] space-y-1">
                <strong className="text-[#F8FAFC] text-sm block">Option A: Direct 1-Click Sync (Recommended)</strong>
                <p>Click <strong>"Sync Google Calendar"</strong> on top. The assistant connects with permission to your Google Calendar to load your events automatically!</p>
              </div>

              <div className="bg-[#18223A] p-3 rounded-xl border border-[#1E293B] space-y-1">
                <strong className="text-[#F8FAFC] text-sm block">Option B: Manual .ics File Export</strong>
                <p>1. Visit <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-[#38BDF8] underline inline-flex items-center gap-0.5">calendar.google.com <ExternalLink size={10} /></a>.</p>
                <p>2. Click gear icon ⚙️ &gt; <strong>Settings</strong> &gt; <strong>Import &amp; export</strong> &gt; <strong>Export</strong>.</p>
                <p>3. Unzip the downloaded file and click <strong>Attach Calendar</strong> to drop your <code className="bg-[#0B1020] px-1 py-0.5 rounded text-[#22D3EE]">.ics</code> file here!</p>
              </div>

              <div className="p-3 rounded-xl bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 text-[#A78BFA] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Volume2 size={13} />
                  <span>Proactive Reminders &amp; Alarms:</span>
                </div>
                <p>
                  Click <strong>"Enable Reminders"</strong> to receive desktop notifications and audio chimes whenever you have tasks or events scheduled today!
                </p>
                <button
                  type="button"
                  onClick={playChime}
                  className="mt-1 text-[11px] underline hover:text-white cursor-pointer inline-flex items-center gap-1"
                >
                  <Volume2 size={11} /> Test Reminder Audio Tone
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowGuideModal(false);
                  setShowImportBox(true);
                }}
                className="px-5 py-2 bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white font-semibold rounded-xl text-xs shadow-lg transition cursor-pointer"
              >
                Attach Calendar File →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Modal for Destructive/Mutating Workspace Operations */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                confirmModal.isDestructive 
                  ? 'bg-[#FB7185]/20 border-[#FB7185]/40 text-[#FB7185]' 
                  : 'bg-[#38BDF8]/20 border-[#38BDF8]/40 text-[#38BDF8]'
              }`}>
                {confirmModal.isDestructive ? <AlertTriangle size={20} /> : <CalendarIcon size={20} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">{confirmModal.title}</h3>
                <p className="text-xs text-[#94A3B8]">Google Calendar Workspace Confirmation</p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-[#18223A] hover:bg-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition cursor-pointer ${
                  confirmModal.isDestructive
                    ? 'bg-[#FB7185] hover:bg-[#F43F5E]'
                    : 'bg-[#7C5CFC] hover:bg-[#6D4AE6]'
                }`}
              >
                {confirmModal.actionText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

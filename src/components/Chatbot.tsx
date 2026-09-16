import { useState, useRef, useEffect } from 'react';
import { auth } from '../lib/firebase';
import AudioRecorder from './AudioRecorder';
import { MessageSquare, Send, Bot, User as UserIcon } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [previousInteractionId, setPreviousInteractionId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user' as const, text };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, previousInteractionId, userId: auth.currentUser?.uid }),
      });
      const data = await response.json();
      
      if (response.status === 429) {
        setMessages(prev => [...prev, { role: 'model', text: 'You have exceeded your API usage limit. Please wait a moment before trying again.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: data.response }]);
        setPreviousInteractionId(data.interactionId);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'I am taking a quick breath. Feel free to continue organizing your priority board or try messaging again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121A2E] p-6 rounded-2xl shadow-xl border border-[#1E293B] text-[#F8FAFC] flex flex-col h-[450px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#18223A] border border-[#7C5CFC]/40 flex items-center justify-center text-[#7C5CFC]">
          <Bot size={20} className="text-[#7C5CFC]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Conversational Assistant</h2>
          <p className="text-xs text-[#94A3B8]">Deep thought partner aligned with your values</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-4 space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-xs text-[#94A3B8] text-center p-4 border border-dashed border-[#1E293B] rounded-xl bg-[#0B1020]/40">
            <MessageSquare size={24} className="text-[#7C5CFC] mb-2 opacity-50" />
            <p>Ask for prioritization ideas, review your recent energy rhythm, or talk through a problem.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`flex items-start gap-2.5 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
              m.role === 'user' 
                ? 'bg-[#7C5CFC] text-white' 
                : 'bg-[#18223A] text-[#22D3EE] border border-[#1E293B]'
            }`}>
              {m.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
            </div>
            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
              m.role === 'user' 
                ? 'bg-[#7C5CFC] text-[#F8FAFC] rounded-tr-xs shadow-md shadow-[#7C5CFC]/20' 
                : 'bg-[#18223A] text-[#F8FAFC] rounded-tl-xs border border-[#1E293B]'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] italic pl-2">
            <Bot size={13} className="text-[#7C5CFC] animate-spin" />
            <span>Assistant is thinking...</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-[#1E293B]">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          className="flex-1 bg-[#18223A] border border-[#1E293B] focus:border-[#7C5CFC] focus:outline-none rounded-xl px-3.5 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 transition"
          placeholder="Ask a question or explore a challenge..."
          onKeyDown={e => e.key === 'Enter' && (sendMessage(input), setInput(''))}
        />
        <button 
          onClick={() => { sendMessage(input); setInput(''); }} 
          className="bg-[#7C5CFC] hover:bg-[#6844F7] text-[#F8FAFC] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-[#7C5CFC]/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer" 
          disabled={loading || !input.trim()}
        >
          <Send size={14} />
          <span className="hidden sm:inline">Send</span>
        </button>
        <AudioRecorder onTranscribe={(text) => sendMessage(text)} />
      </div>
    </div>
  );
}

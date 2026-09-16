import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

export default function AudioRecorder({ onTranscribe }: { onTranscribe: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              if (res && res.includes(',')) {
                resolve(res.split(',')[1]);
              } else {
                resolve('');
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(audioBlob);
          });

          if (base64Audio) {
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData: base64Audio, mimeType: 'audio/webm' }),
            });
            const data = await response.json();
            if (data.text) {
              onTranscribe(data.text);
            }
          }
        } catch (err) {
          console.warn('Audio transcribe note:', err);
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      console.warn('Microphone access note:', err);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  return (
    <button 
      type="button"
      onClick={recording ? stopRecording : startRecording}
      disabled={transcribing}
      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
        recording 
          ? 'bg-[#FB7185]/20 border-[#FB7185] text-[#FB7185] animate-pulse' 
          : 'bg-[#18223A] border-[#1E293B] text-[#94A3B8] hover:border-[#22D3EE]/40 hover:text-[#22D3EE]'
      }`}
      title={recording ? 'Stop voice recording' : 'Speak to assistant'}
    >
      {transcribing ? (
        <Loader2 size={15} className="animate-spin text-[#22D3EE]" />
      ) : recording ? (
        <>
          <Square size={14} fill="currentColor" />
          <span>Stop</span>
        </>
      ) : (
        <>
          <Mic size={15} />
          <span className="hidden sm:inline">Voice</span>
        </>
      )}
    </button>
  );
}

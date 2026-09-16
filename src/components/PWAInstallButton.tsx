import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowIOSGuide(false);
        setShowDesktopGuide(false);
      }
    };
    if (showIOSGuide || showDesktopGuide) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIOSGuide, showDesktopGuide]);

  // If already running as an installed standalone PWA, hide or show minimal badge
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18223A] border border-[#1E293B] text-xs text-[#34D399]">
        <CheckCircle2 size={13} />
        <span>Installed App</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={async () => {
          const success = await install();
          if (success) {
            setInstalledNotice(true);
            setTimeout(() => setInstalledNotice(false), 4000);
          }
        }}
        className="flex items-center gap-2 rounded-lg bg-[#7C5CFC] hover:bg-[#6844F7] px-3.5 py-1.5 text-xs font-semibold text-[#F8FAFC] shadow-lg shadow-[#7C5CFC]/20 transition border border-[#9075FF]/30 active:scale-95 cursor-pointer"
        title="Install to your phone or laptop homescreen"
      >
        <Download size={14} />
        <span>Add to Home Screen</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg bg-[#18223A] hover:bg-[#1E293B] border border-[#7C5CFC]/40 px-3 py-1.5 text-xs font-semibold text-[#F8FAFC] transition cursor-pointer"
          title="Install on iPhone / iPad"
        >
          <Smartphone size={14} className="text-[#22D3EE]" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-modal-title"
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#121A2E] border border-[#1E293B] p-6 shadow-2xl relative text-left">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-[#18223A]"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 rounded-xl bg-[#18223A] border border-[#7C5CFC]/30 flex items-center justify-center mb-4 text-[#22D3EE]">
                <Smartphone size={24} />
              </div>

              <h3 id="ios-modal-title" className="text-lg font-bold text-[#F8FAFC]">Install on iPhone / iPad</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
                Install this personal assistant to your home screen to launch in fullscreen without browser bars:
              </p>

              <div className="mt-4 space-y-2.5 bg-[#0B1020] p-3.5 rounded-xl border border-[#1E293B] text-xs text-[#F8FAFC]">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Tap the <strong className="text-[#22D3EE]">Share</strong> icon in Safari's bottom toolbar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Scroll down and select <strong className="text-[#34D399]">Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Tap <strong className="text-[#F8FAFC]">Add</strong> at the top right.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#7C5CFC] py-2.5 text-xs font-semibold text-[#F8FAFC] hover:bg-[#6844F7] transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop Chrome/Edge where beforeinstallprompt may not have triggered yet or general browsers
  return (
    <>
      <button
        onClick={() => setShowDesktopGuide(true)}
        className="hidden md:flex items-center gap-1.5 rounded-lg bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#7C5CFC]/40 px-3 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
        title="How to install as app"
      >
        <Download size={13} className="text-[#7C5CFC]" />
        <span>Install App</span>
      </button>

      {showDesktopGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-modal-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#121A2E] border border-[#1E293B] p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowDesktopGuide(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-[#18223A] cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-xl bg-[#18223A] border border-[#7C5CFC]/30 flex items-center justify-center mb-4 text-[#7C5CFC]">
              <Download size={24} />
            </div>

            <h3 id="desktop-modal-title" className="text-lg font-bold text-[#F8FAFC]">Install Desktop / Android App</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Install this app for offline sanctuary access, fast startup, and native desktop windowing:
            </p>

            <div className="mt-4 space-y-2.5 bg-[#0B1020] p-3.5 rounded-xl border border-[#1E293B] text-xs text-[#F8FAFC]">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <span><strong>Chrome / Edge:</strong> Click the <span className="text-[#22D3EE]">Install</span> icon in the browser address bar.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                <span><strong>Safari (macOS):</strong> Go to <span className="text-[#34D399]">File &gt; Add to Dock</span>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <span><strong>Android:</strong> Tap the browser menu (⋮) and choose <span className="text-[#FBBF24]">Install app</span>.</span>
              </div>
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#7C5CFC] py-2.5 text-xs font-semibold text-[#F8FAFC] hover:bg-[#6844F7] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

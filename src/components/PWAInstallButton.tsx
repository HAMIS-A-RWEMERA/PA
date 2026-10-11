import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Laptop, Apple, X, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [installedNotice, setInstalledNotice] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    if (showModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // If already running as an installed standalone PWA
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs text-[#34D399] font-medium">
        <CheckCircle2 size={13} />
        <span className="hidden sm:inline">Installed App</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledNotice(true);
        setTimeout(() => setInstalledNotice(false), 4000);
        return;
      }
    }
    // Set appropriate initial tab
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setActiveTab('ios');
    } else if (/android/.test(userAgent)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }
    setShowModal(true);
  };

  const handleOpenStandaloneTab = () => {
    // Opening top-level allows browser to fire native install prompt
    const standaloneUrl = window.location.href;
    window.open(standaloneUrl, '_blank');
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#7C5CFC]/20 hover:bg-[#7C5CFC]/30 text-[#A78BFA] border border-[#7C5CFC]/40 transition cursor-pointer active:scale-95 shadow-sm"
        title="Install to your phone or laptop home screen"
      >
        <Download size={13} className="text-[#A78BFA]" />
        <span>Install App</span>
      </button>

      {installedNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#121A2E] border border-[#10B981]/50 text-xs text-[#34D399] rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>App successfully installed to your home screen!</span>
        </div>
      )}

      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#121A2E] border border-[#1E293B] p-6 shadow-2xl relative text-left space-y-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-[#18223A] cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 flex items-center justify-center text-[#A78BFA]">
                <Download size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Install Personal Assistant</h3>
                <p className="text-xs text-[#94A3B8]">Add to your Phone or Laptop home screen</p>
              </div>
            </div>

            {/* In-browser Open Button */}
            <div className="p-3.5 rounded-xl bg-[#18223A] border border-[#7C5CFC]/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-[#F8FAFC] block">Open Full Screen Tab</span>
                <span className="text-[11px] text-[#94A3B8]">Allows your browser to trigger native 1-click install</span>
              </div>
              <button
                onClick={handleOpenStandaloneTab}
                className="px-3 py-1.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer flex-shrink-0"
              >
                <span>Open Tab</span>
                <ExternalLink size={11} />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex rounded-xl bg-[#0B1020] p-1 border border-[#1E293B] text-xs">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'android' ? 'bg-[#18223A] text-[#22D3EE] shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Smartphone size={13} />
                <span>Android</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'ios' ? 'bg-[#18223A] text-[#A78BFA] shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Apple size={13} />
                <span>iPhone / iPad</span>
              </button>
              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'desktop' ? 'bg-[#18223A] text-[#34D399] shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Laptop size={13} />
                <span>Laptop / PC</span>
              </button>
            </div>

            {/* Platform Specific Steps */}
            <div className="space-y-2.5 bg-[#0B1020] p-4 rounded-xl border border-[#1E293B] text-xs text-[#F8FAFC]">
              {activeTab === 'android' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                    <span>Open in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your phone.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    <span>Tap the top-right menu <strong className="text-[#22D3EE]">⋮</strong> (three dots).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                    <span>Select <strong className="text-[#34D399]">"Install app"</strong> or <strong className="text-[#34D399]">"Add to Home screen"</strong>.</span>
                  </div>
                </>
              )}

              {activeTab === 'ios' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#A78BFA]/20 text-[#A78BFA] flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                    <span>Open in <strong>Safari</strong> on your iPhone or iPad.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#A78BFA]/20 text-[#A78BFA] flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    <span>Tap the <strong className="text-[#22D3EE]">Share</strong> icon at the bottom toolbar.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#A78BFA]/20 text-[#A78BFA] flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                    <span>Scroll down and tap <strong className="text-[#34D399]">"Add to Home Screen"</strong>, then tap <strong>Add</strong>.</span>
                  </div>
                </>
              )}

              {activeTab === 'desktop' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#34D399]/20 text-[#34D399] flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                    <span><strong>Chrome or Edge on Laptop:</strong> Look at the right side of the URL address bar for the <strong className="text-[#22D3EE]">Install icon (⊕)</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#34D399]/20 text-[#34D399] flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    <span>Or click the browser menu <strong className="text-[#22D3EE]">⋮</strong> &gt; select <strong className="text-[#34D399]">"Install Personal Assistant"</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#34D399]/20 text-[#34D399] flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                    <span>On Mac Safari: click <strong className="text-[#34D399]">File &gt; Add to Dock</strong>.</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-xl bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] py-2.5 text-xs font-semibold text-[#F8FAFC] transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Network status notification"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-[#18223A] border border-[#FBBF24]/50 px-4 py-2.5 text-xs font-medium text-[#F8FAFC] shadow-2xl backdrop-blur-md animate-bounce"
    >
      <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] animate-ping" />
      <WifiOff size={15} className="text-[#FBBF24]" />
      <span>
        <strong className="text-[#FBBF24]">Offline Mode:</strong> All changes will sync automatically once reconnected.
      </span>
      <RefreshCw size={13} className="text-[#22D3EE] animate-spin ml-1" />
    </aside>
  );
};

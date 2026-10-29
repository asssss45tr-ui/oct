import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, AlertTriangle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 flex items-center gap-3 rounded-2xl bg-amber-600/95 text-white px-4 py-3 shadow-xl backdrop-blur-md border border-amber-400/40 animate-slide-up"
      dir="rtl"
    >
      <div className="p-2 bg-amber-700 rounded-xl flex-shrink-0">
        <WifiOff className="w-5 h-5 animate-pulse" />
      </div>
      <div className="text-xs">
        <div className="font-bold flex items-center gap-1.5">
          حالت آفلاین (Offline Mode)
        </div>
        <div className="text-amber-100 text-[11px] mt-0.5">
          ارتباط اینترنت قطع است. ترددها به طور خودکار در حافظه گوشی ذخیره می‌شوند.
        </div>
      </div>
    </div>
  );
};

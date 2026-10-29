import React from 'react';
import { PWAInstallBanner } from './PWAInstallBanner';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Smartphone, Users, UserCheck, Shield, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  currentView: 'worker' | 'admin';
  onViewChange: (view: 'worker' | 'admin') => void;
  activeWorkersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  activeWorkersCount,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/icon-192.png"
              alt="کارمندیار PWA"
              className="w-10 h-10 rounded-2xl shadow-md border border-blue-500/30 object-cover"
            />
            <span
              className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              title={isOnline ? 'آنلاین' : 'آفلاین'}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                سامانه کارمندیار
              </h1>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              ثبت هوشمند تردد، اسکن QR کد و مدیریت کارکرد پرسنل
            </p>
          </div>
        </div>

        {/* Center: View Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            id="view-toggle-worker"
            onClick={() => onViewChange('worker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentView === 'worker'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>پنل کارگر</span>
          </button>

          <button
            id="view-toggle-admin"
            onClick={() => onViewChange('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentView === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>پنل مدیریت</span>
          </button>
        </div>

        {/* Left Side: PWA Install Button */}
        <div className="flex items-center gap-2">
          <PWAInstallBanner variant="button" />
        </div>
      </div>
    </header>
  );
};

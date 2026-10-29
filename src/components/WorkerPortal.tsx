import React, { useState, useEffect } from 'react';
import { Worker, AttendanceRecord, Invoice } from '../types';
import {
  QrCode,
  LogIn,
  LogOut,
  Clock,
  Calendar,
  CheckCircle2,
  Timer,
  FileText,
  User,
  AlertCircle,
  Coins,
  ShieldCheck,
  Smartphone,
  ChevronDown
} from 'lucide-react';

interface WorkerPortalProps {
  workers: Worker[];
  attendanceRecords: AttendanceRecord[];
  invoices: Invoice[];
  onCheckInOut: (workerId: string, type: 'check-in' | 'check-out', method: 'qr' | 'manual', note?: string) => void;
  onOpenQRScanner: (workerId: string) => void;
  onOpenQRBadge: (worker: Worker) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const WorkerPortal: React.FC<WorkerPortalProps> = ({
  workers,
  attendanceRecords,
  invoices,
  onCheckInOut,
  onOpenQRScanner,
  onOpenQRBadge,
  onViewInvoice,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || '');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [elapsedShiftSeconds, setElapsedShiftSeconds] = useState<number>(0);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];

  // Find last attendance record for this worker today
  const todayStr = new Date().toLocaleDateString('fa-IR');
  const workerTodayRecords = attendanceRecords.filter(
    (r) => r.workerId === selectedWorker?.id && r.date === todayStr
  );
  const lastRecord = workerTodayRecords[workerTodayRecords.length - 1];
  const isInShift = lastRecord?.type === 'check-in';

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(now.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Shift timer if in shift
  useEffect(() => {
    if (!isInShift || !lastRecord) {
      setElapsedShiftSeconds(0);
      return;
    }

    const checkInDate = new Date(lastRecord.timestamp).getTime();
    const updateShiftTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - checkInDate) / 1000));
      setElapsedShiftSeconds(diff);
    };

    updateShiftTimer();
    const interval = setInterval(updateShiftTimer, 1000);
    return () => clearInterval(interval);
  }, [isInShift, lastRecord]);

  const formatSeconds = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const estimatedTodayEarnings = selectedWorker
    ? Math.round((elapsedShiftSeconds / 3600) * selectedWorker.hourlyRate)
    : 0;

  // Filter worker's invoices
  const workerInvoices = invoices.filter((i) => i.workerId === selectedWorker?.id);

  if (!selectedWorker) {
    return (
      <div className="p-8 text-center text-slate-400">
        هیچ کارگری در سامانه تعریف نشده است. لطفاً از پنل مدیریت کارگر جدید اضافه نمایید.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12" dir="rtl">
      {/* Top Worker Selector Card */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl ${selectedWorker.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center text-xl font-bold shadow-md`}>
              {selectedWorker.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{selectedWorker.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  کد: {selectedWorker.code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isInShift
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {isInShift ? '● در حال کار در شیفت' : '○ خارج از شیفت'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedWorker.role} | نرخ ساعتی: {new Intl.NumberFormat('fa-IR').format(selectedWorker.hourlyRate)} تومان</p>
            </div>
          </div>

          {/* Quick Worker Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <select
                id="worker-select-dropdown"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer pr-8"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code} - {w.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => onOpenQRBadge(selectedWorker)}
              className="px-3 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white text-xs flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
              title="مشاهده کارت QR"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">کارت پرسنلی</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Shift Status & Action Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left 2 Cols: Timer & Check-in / Check-out */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {currentDate}
              </div>
              <div className="text-2xl font-black text-white font-mono tracking-wider mt-1">
                {currentTime}
              </div>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-400 block">وضعیت امروز</span>
              <span className={`text-xs font-bold ${isInShift ? 'text-emerald-400' : 'text-slate-300'}`}>
                {isInShift ? 'شیفت باز' : 'در انتظار شروع شیفت'}
              </span>
            </div>
          </div>

          {/* Shift Live Timer */}
          <div className="my-3 text-center py-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mb-1 font-medium">
              <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
              مدت زمان حضور در شیفت کاری امروز:
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-widest text-emerald-400 drop-shadow-md">
              {formatSeconds(elapsedShiftSeconds)}
            </div>
            {isInShift && (
              <div className="text-[11px] text-slate-400 mt-2">
                ساعت ورود ثبت شده: <strong className="text-white">{lastRecord?.time}</strong> (روش: {lastRecord?.method === 'qr' ? 'اسکن QR کد' : 'دستی'})
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isInShift ? (
              <>
                <button
                  id="worker-checkin-btn"
                  onClick={() => onCheckInOut(selectedWorker.id, 'check-in', 'manual')}
                  className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  ثبت سریع ورود (شروع شیفت)
                </button>
                <button
                  onClick={() => onOpenQRScanner(selectedWorker.id)}
                  className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-blue-500/40 text-blue-300 font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-5 h-5 text-blue-400" />
                  ثبت ورود با اسکن QR کد
                </button>
              </>
            ) : (
              <>
                <button
                  id="worker-checkout-btn"
                  onClick={() => onCheckInOut(selectedWorker.id, 'check-out', 'manual')}
                  className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  ثبت خروج از کارگاه (پایان شیفت)
                </button>
                <button
                  onClick={() => onOpenQRScanner(selectedWorker.id)}
                  className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-5 h-5 text-amber-400" />
                  ثبت خروج با اسکن QR کد
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Stats & Earnings */}
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 shadow-lg">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-2 font-medium">
              <Coins className="w-4 h-4 text-amber-400" />
              تخمین دستمزد کارکرد امروز:
            </div>
            <div className="text-xl font-extrabold text-amber-400 font-mono">
              {new Intl.NumberFormat('fa-IR').format(estimatedTodayEarnings)} تومان
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              بر مبنای نرخ ساعتی {new Intl.NumberFormat('fa-IR').format(selectedWorker.hourlyRate)} تومان
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 shadow-lg">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-3 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              اطلاعات پرسنلی کارگر:
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">شماره تماس:</span>
                <span className="text-slate-200 font-mono">{selectedWorker.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">کد ملی:</span>
                <span className="text-slate-200 font-mono">{selectedWorker.nationalId || 'ثبت نشده'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">تاریخ شروع به کار:</span>
                <span className="text-slate-200">{selectedWorker.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Worker Attendance Logs for Today & Recent */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">ترددهای ثبت شده امروز کارگر ({selectedWorker.name})</h3>
          </div>
          <span className="text-xs text-slate-400">تاریخ: {todayStr}</span>
        </div>

        {workerTodayRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            هنوز برای امروز ترددی ثبت نشده است. با زدن دکمه «ثبت ورود» یا «اسکن QR کد» شیفت کاری خود را آغاز کنید.
          </div>
        ) : (
          <div className="space-y-2">
            {workerTodayRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-slate-700/50 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      rec.type === 'check-in'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {rec.type === 'check-in' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {rec.type === 'check-in' ? 'ورود به کارگاه' : 'خروج از کارگاه'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      روش: {rec.method === 'qr' ? 'اسکن بارکد QR' : 'ثبت مستقیم'} {rec.location && `| ${rec.location}`}
                    </div>
                  </div>
                </div>

                <div className="text-left font-mono font-bold text-sm text-slate-200">
                  {rec.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Worker Invoices / Pay slips */}
      {workerInvoices.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">فیش‌های حقوقی و فاکتورهای کارکرد من</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workerInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between hover:border-blue-500/40 transition cursor-pointer"
                onClick={() => onViewInvoice(inv)}
              >
                <div>
                  <div className="text-xs font-bold text-white">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    دوره: {inv.periodStart} تا {inv.periodEnd}
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 mt-2">
                    {new Intl.NumberFormat('fa-IR').format(inv.totalAmount)} تومان
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      inv.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {inv.status === 'paid' ? 'پرداخت شده' : 'تأیید شده'}
                  </span>
                  <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                    مشاهده فیش
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

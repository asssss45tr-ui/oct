import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Worker } from '../types';
import { X, Printer, Download, QrCode, User, Phone, CheckCircle2 } from 'lucide-react';

interface WorkerQRBadgeModalProps {
  worker: Worker | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkerQRBadgeModal: React.FC<WorkerQRBadgeModalProps> = ({ worker, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!worker) return;
    // The QR contains a formatted JSON or worker code
    const qrPayload = JSON.stringify({
      id: worker.id,
      code: worker.code,
      name: worker.name,
      type: 'WORKER_ATTENDANCE_BADGE',
    });

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR:', err));
  }, [worker]);

  if (!isOpen || !worker) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-Badge-${worker.code}-${worker.name}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-white">کارت شناسایی و QR کد پرسنلی</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable ID Badge Container */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/60">
          <div
            id="printable-badge"
            className="w-full max-w-[280px] bg-white text-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Top Badge Header */}
            <div className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-2 px-3 rounded-xl mb-4 shadow-sm">
              <div className="text-[11px] font-bold tracking-wide">کارت تردد پرسنلی هوشمند</div>
              <div className="text-[9px] text-blue-200">سامانه مدیریت کارمندیار PWA</div>
            </div>

            {/* Avatar */}
            <div className={`w-16 h-16 rounded-full ${worker.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center text-xl font-bold mb-2 shadow-md`}>
              {worker.name.slice(0, 1)}
            </div>

            {/* Name & Role */}
            <h4 className="text-base font-extrabold text-slate-900">{worker.name}</h4>
            <div className="text-xs font-semibold text-blue-700 mt-0.5">{worker.role}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">کد پرسنلی: {worker.code}</div>

            {/* QR Code */}
            <div className="my-3 p-2 bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Worker QR Code" className="w-36 h-36 object-contain" />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">در حال تولید...</div>
              )}
            </div>

            <div className="text-[10px] text-slate-600 font-medium">
              جهت ثبت ورود و خروج، این بارکد را مقابل اسکنر قرار دهید
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            دانلود تصویر QR
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            چاپ کارت
          </button>
        </div>
      </div>
    </div>
  );
};

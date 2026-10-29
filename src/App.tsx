/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Worker, AttendanceRecord, Invoice } from './types';
import { INITIAL_WORKERS, INITIAL_ATTENDANCE, INITIAL_INVOICES } from './data/initialData';
import { Header } from './components/Header';
import { WorkerPortal } from './components/WorkerPortal';
import { AdminPortal } from './components/AdminPortal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { QRScannerModal } from './components/QRScannerModal';
import { WorkerQRBadgeModal } from './components/WorkerQRBadgeModal';
import { InvoiceModal } from './components/InvoiceModal';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  // Persistence with localStorage
  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('karmand_workers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_WORKERS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('karmand_attendance');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_ATTENDANCE;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('karmand_invoices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_INVOICES;
  });

  const [currentView, setCurrentView] = useState<'worker' | 'admin'>('worker');

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetWorkerId, setScannerTargetWorkerId] = useState<string>('');
  const [badgeWorker, setBadgeWorker] = useState<Worker | null>(null);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('karmand_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('karmand_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('karmand_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Handle Check-in / Check-out
  const handleCheckInOut = (
    workerId: string,
    type: 'check-in' | 'check-out',
    method: 'qr' | 'manual' = 'manual',
    notes?: string
  ) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('fa-IR');

    const newRecord: AttendanceRecord = {
      id: 'att-' + Date.now(),
      workerId: worker.id,
      workerName: worker.name,
      workerCode: worker.code,
      type,
      timestamp: now.toISOString(),
      date: dateStr,
      time: timeStr,
      method,
      location: method === 'qr' ? 'اسکن بارکد QR ایستگاه کارگاه' : 'ثبت مستقیم در اپلیکیشن',
      notes,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);

    const actionText = type === 'check-in' ? 'ورود به کارگاه' : 'خروج از کارگاه';
    showToast(`✓ ${actionText} برای ${worker.name} با موفقیت در ساعت ${timeStr} ثبت گردید.`);
  };

  // QR Scan handler
  const handleQRScanSuccess = (scannedText: string) => {
    let matchedWorker: Worker | undefined;

    // Check if JSON
    try {
      const parsed = JSON.parse(scannedText);
      if (parsed.id) {
        matchedWorker = workers.find((w) => w.id === parsed.id || w.code === parsed.code);
      }
    } catch {
      // Plain text code
      matchedWorker = workers.find(
        (w) => w.code === scannedText || w.id === scannedText || scannedText.includes(w.code)
      );
    }

    // If scanner was triggered for a specific worker, fallback to that worker
    if (!matchedWorker && scannerTargetWorkerId) {
      matchedWorker = workers.find((w) => w.id === scannerTargetWorkerId);
    }

    if (!matchedWorker) {
      showToast(`کد اسکن شده («${scannedText}») با هیچ کارگری مطابقت ندارد.`, 'info');
      return;
    }

    // Determine if worker is currently in shift
    const todayStr = new Date().toLocaleDateString('fa-IR');
    const workerToday = attendanceRecords.filter((r) => r.workerId === matchedWorker!.id && r.date === todayStr);
    const lastRec = workerToday[workerToday.length - 1];
    const nextType: 'check-in' | 'check-out' = lastRec?.type === 'check-in' ? 'check-out' : 'check-in';

    handleCheckInOut(matchedWorker.id, nextType, 'qr');
  };

  // Worker CRUD
  const handleAddWorker = (newWorkerData: Omit<Worker, 'id'>) => {
    const newWorker: Worker = {
      ...newWorkerData,
      id: 'w-' + (workers.length + 101),
    };
    setWorkers((prev) => [...prev, newWorker]);
    showToast(`کارگر جدید «${newWorker.name}» با موفقیت اضافه شد.`);
  };

  const handleUpdateWorker = (updatedWorker: Worker) => {
    setWorkers((prev) => prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w)));
    showToast(`مشخصات کارگر «${updatedWorker.name}» به‌روزرسانی شد.`);
  };

  const handleDeleteWorker = (workerId: string) => {
    const target = workers.find((w) => w.id === workerId);
    setWorkers((prev) => prev.filter((w) => w.id !== workerId));
    showToast(`کارگر «${target?.name || ''}» حذف شد.`);
  };

  // Attendance manual
  const handleManualAttendance = (
    workerId: string,
    type: 'check-in' | 'check-out',
    time: string,
    date: string
  ) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;

    const newRec: AttendanceRecord = {
      id: 'att-' + Date.now(),
      workerId: worker.id,
      workerName: worker.name,
      workerCode: worker.code,
      type,
      timestamp: new Date().toISOString(),
      date,
      time,
      method: 'manual',
      location: 'ثبت دستی مدیریت',
    };
    setAttendanceRecords((prev) => [newRec, ...prev]);
    showToast(`تردد دستی برای «${worker.name}» با موفقیت ثبت شد.`);
  };

  const handleDeleteAttendance = (recordId: string) => {
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== recordId));
    showToast('تردد مورد نظر با موفقیت حذف گردید.');
  };

  // Invoice creation
  const handleCreateInvoice = (newInvoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const invNum = `INV-1403-${String(invoices.length + 101).padStart(4, '0')}`;
    const newInv: Invoice = {
      ...newInvoiceData,
      id: 'inv-' + Date.now(),
      invoiceNumber: invNum,
    };
    setInvoices((prev) => [newInv, ...prev]);
    showToast(`فاکتور شماره ${invNum} با موفقیت صادر گردید.`);
  };

  const handleInvoiceStatusChange = (id: string, newStatus: Invoice['status']) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv)));
    setSelectedInvoice((prev) => (prev && prev.id === id ? { ...prev, status: newStatus } : prev));
    showToast('وضعیت فاکتور تغییر یافت.');
  };

  // Calculate active workers count
  const todayStr = new Date().toLocaleDateString('fa-IR');
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  const activeWorkersCount = workers.filter((w) => {
    const workerToday = todayRecords.filter((r) => r.workerId === w.id);
    return workerToday[workerToday.length - 1]?.type === 'check-in';
  }).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Top Banner for PWA Installation */}
      <PWAInstallBanner variant="banner" />

      {/* Main App Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        activeWorkersCount={activeWorkersCount}
      />

      {/* Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">
        {currentView === 'worker' ? (
          <WorkerPortal
            workers={workers}
            attendanceRecords={attendanceRecords}
            invoices={invoices}
            onCheckInOut={handleCheckInOut}
            onOpenQRScanner={(wId) => {
              setScannerTargetWorkerId(wId);
              setIsScannerOpen(true);
            }}
            onOpenQRBadge={(worker) => {
              setBadgeWorker(worker);
              setIsBadgeOpen(true);
            }}
            onViewInvoice={(invoice) => {
              setSelectedInvoice(invoice);
              setIsInvoiceOpen(true);
            }}
          />
        ) : (
          <AdminPortal
            workers={workers}
            attendanceRecords={attendanceRecords}
            invoices={invoices}
            onAddWorker={handleAddWorker}
            onUpdateWorker={handleUpdateWorker}
            onDeleteWorker={handleDeleteWorker}
            onOpenQRBadge={(worker) => {
              setBadgeWorker(worker);
              setIsBadgeOpen(true);
            }}
            onManualAttendance={handleManualAttendance}
            onDeleteAttendance={handleDeleteAttendance}
            onCreateInvoice={handleCreateInvoice}
            onViewInvoice={(invoice) => {
              setSelectedInvoice(invoice);
              setIsInvoiceOpen(true);
            }}
          />
        )}
      </main>

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:max-w-md z-50 flex items-center gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700 text-white shadow-2xl backdrop-blur-md animate-slide-up">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold leading-relaxed flex-1">
            {toastMessage.text}
          </div>
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* Worker QR Badge / Card Modal */}
      <WorkerQRBadgeModal
        worker={badgeWorker}
        isOpen={isBadgeOpen}
        onClose={() => setIsBadgeOpen(false)}
      />

      {/* Invoice & Pay Slip Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        worker={workers.find((w) => w.id === selectedInvoice?.workerId)}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        onStatusChange={handleInvoiceStatusChange}
      />

      {/* Offline Status Alert */}
      <OfflineIndicator />
    </div>
  );
}

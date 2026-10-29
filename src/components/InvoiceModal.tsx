import React from 'react';
import { Invoice, Worker } from '../types';
import { X, Printer, Download, CheckCircle2, Building2, Calendar, FileText } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  worker?: Worker;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: Invoice['status']) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  worker,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num) + ' تومان';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-white">فاکتور و فیش حقوقی کارکرد پرسنل</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              پرینت فاکتور
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body - Printable */}
        <div className="p-6 md:p-8 bg-slate-950/40">
          <div
            id="printable-invoice-content"
            className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200"
          >
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-blue-600 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  KY
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">سامانه کارمندیار - فیش تسویه کارکرد</h2>
                  <p className="text-xs text-slate-500 mt-0.5">کارگاه تولیدی و صنعتی نمونه</p>
                </div>
              </div>
              <div className="text-left text-xs space-y-1">
                <div className="font-semibold text-slate-800">
                  شماره فاکتور: <span className="font-mono text-blue-700 font-bold">{invoice.invoiceNumber}</span>
                </div>
                <div className="text-slate-500">تاریخ صدور: {invoice.createdAt}</div>
                <div>
                  وضعیت:
                  <span
                    className={`mr-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      invoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : invoice.status === 'approved'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {invoice.status === 'paid' ? 'پرداخت شده' : invoice.status === 'approved' ? 'تأیید شده' : 'پیش‌نویس'}
                  </span>
                </div>
              </div>
            </div>

            {/* Worker Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">نام و نام خانوادگی:</span>
                <strong className="text-slate-900 text-sm">{invoice.workerName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">کد پرسنلی:</span>
                <strong className="font-mono text-slate-900 text-sm">{invoice.workerCode}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">سمت سازمانی:</span>
                <span className="text-slate-900 font-medium">{worker?.role || 'پرسنل فنی'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">دوره کارکرد:</span>
                <span className="text-slate-900 font-medium">{invoice.periodStart} الی {invoice.periodEnd}</span>
              </div>
            </div>

            {/* Calculations Table */}
            <div className="overflow-x-auto my-6">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                    <th className="py-2.5 px-3 font-bold">شرح کارکرد / آیتم</th>
                    <th className="py-2.5 px-3 font-bold text-center">مقدار (ساعت)</th>
                    <th className="py-2.5 px-3 font-bold text-center">نرخ هر واحد</th>
                    <th className="py-2.5 px-3 font-bold text-left">مجموع (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-3 font-medium text-slate-800">ساعات کارکرد عادی</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{formatNumber(invoice.regularHours)} ساعت</td>
                    <td className="py-3 px-3 text-center">{formatNumber(invoice.hourlyRate)}</td>
                    <td className="py-3 px-3 text-left font-bold">{formatPrice(invoice.regularHours * invoice.hourlyRate)}</td>
                  </tr>
                  {invoice.overtimeHours > 0 && (
                    <tr className="bg-blue-50/40">
                      <td className="py-3 px-3 font-medium text-slate-800">اضافه‌کاری مصوب</td>
                      <td className="py-3 px-3 text-center font-bold text-blue-700">{formatNumber(invoice.overtimeHours)} ساعت</td>
                      <td className="py-3 px-3 text-center">{formatNumber(invoice.overtimeRate || invoice.hourlyRate * 1.4)}</td>
                      <td className="py-3 px-3 text-left font-bold text-blue-700">
                        {formatPrice(invoice.overtimeHours * (invoice.overtimeRate || invoice.hourlyRate * 1.4))}
                      </td>
                    </tr>
                  )}
                  {invoice.bonus > 0 && (
                    <tr>
                      <td className="py-3 px-3 font-medium text-slate-800">پاداش حسن انجام کار و حق فنی</td>
                      <td className="py-3 px-3 text-center">-</td>
                      <td className="py-3 px-3 text-center">-</td>
                      <td className="py-3 px-3 text-left font-bold text-emerald-700">+{formatPrice(invoice.bonus)}</td>
                    </tr>
                  )}
                  {invoice.deductions > 0 && (
                    <tr className="bg-rose-50/40">
                      <td className="py-3 px-3 font-medium text-rose-800">کسورات (بیمه، غیبت، مساعده)</td>
                      <td className="py-3 px-3 text-center">-</td>
                      <td className="py-3 px-3 text-center">-</td>
                      <td className="py-3 px-3 text-left font-bold text-rose-700">-{formatPrice(invoice.deductions)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Section */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-6">
              <div>
                <span className="text-xs text-slate-300 block">مجموع ساعات کل کارکرد:</span>
                <strong className="text-sm text-blue-400">{formatNumber(invoice.totalHours)} ساعت کاری</strong>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-300 block">مبلغ قابل پرداخت نهایی:</span>
                <span className="text-lg font-black text-emerald-400">{formatPrice(invoice.totalAmount)}</span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200 text-center text-xs text-slate-600">
              <div className="flex flex-col items-center">
                <span>امضای کارگر / پرسنل</span>
                <div className="h-16 w-32 border-b border-dashed border-slate-400 mt-2" />
              </div>
              <div className="flex flex-col items-center">
                <span>امور مالی و حسابداری</span>
                <div className="h-16 w-32 border-b border-dashed border-slate-400 mt-2" />
              </div>
              <div className="flex flex-col items-center">
                <span>سرپرست / مدیریت کارگاه</span>
                <div className="h-16 w-32 border-b border-dashed border-slate-400 mt-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Status Controls */}
        {onStatusChange && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">تغییر وضعیت فاکتور:</span>
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange(invoice.id, 'draft')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  invoice.status === 'draft' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                پیش‌نویس
              </button>
              <button
                onClick={() => onStatusChange(invoice.id, 'approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  invoice.status === 'approved' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                تأیید شده
              </button>
              <button
                onClick={() => onStatusChange(invoice.id, 'paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  invoice.status === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                پرداخت شد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Worker, AttendanceRecord, Invoice, ActiveTab } from '../types';
import {
  Users,
  Clock,
  FileText,
  BarChart3,
  UserPlus,
  QrCode,
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  DollarSign,
  Briefcase,
  TrendingUp,
  Printer
} from 'lucide-react';

interface AdminPortalProps {
  workers: Worker[];
  attendanceRecords: AttendanceRecord[];
  invoices: Invoice[];
  onAddWorker: (worker: Omit<Worker, 'id'>) => void;
  onUpdateWorker: (worker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
  onOpenQRBadge: (worker: Worker) => void;
  onManualAttendance: (workerId: string, type: 'check-in' | 'check-out', time: string, date: string) => void;
  onDeleteAttendance: (recordId: string) => void;
  onCreateInvoice: (newInvoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  workers,
  attendanceRecords,
  invoices,
  onAddWorker,
  onUpdateWorker,
  onDeleteWorker,
  onOpenQRBadge,
  onManualAttendance,
  onDeleteAttendance,
  onCreateInvoice,
  onViewInvoice,
}) => {
  const [adminTab, setAdminTab] = useState<'overview' | 'workers' | 'attendance' | 'invoices'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [showManualAttendanceModal, setShowManualAttendanceModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  // New Worker Form state
  const [workerName, setWorkerName] = useState('');
  const [workerCode, setWorkerCode] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerNationalId, setWorkerNationalId] = useState('');
  const [workerHourlyRate, setWorkerHourlyRate] = useState('120000');

  // Manual Attendance Form state
  const [manualWorkerId, setManualWorkerId] = useState(workers[0]?.id || '');
  const [manualType, setManualType] = useState<'check-in' | 'check-out'>('check-in');
  const [manualTime, setManualTime] = useState('08:00');
  const [manualDate, setManualDate] = useState(new Date().toLocaleDateString('fa-IR'));

  // Create Invoice Form state
  const [invWorkerId, setInvWorkerId] = useState(workers[0]?.id || '');
  const [invPeriodStart, setInvPeriodStart] = useState('1403/06/01');
  const [invPeriodEnd, setInvPeriodEnd] = useState('1403/06/31');
  const [invRegularHours, setInvRegularHours] = useState('176');
  const [invOvertimeHours, setInvOvertimeHours] = useState('12');
  const [invBonus, setInvBonus] = useState('1000000');
  const [invDeductions, setInvDeductions] = useState('0');

  // Calculations for Overview Dashboard
  const todayStr = new Date().toLocaleDateString('fa-IR');
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);

  // Calculate currently active in shift
  const workersInShift = workers.filter((w) => {
    const workerToday = todayRecords.filter((r) => r.workerId === w.id);
    const last = workerToday[workerToday.length - 1];
    return last?.type === 'check-in';
  });

  const totalInvoicesAmount = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName || !workerCode) return;

    if (editingWorker) {
      onUpdateWorker({
        ...editingWorker,
        name: workerName,
        code: workerCode,
        role: workerRole || 'کارگر فنی',
        phone: workerPhone,
        nationalId: workerNationalId,
        hourlyRate: Number(workerHourlyRate) || 100000,
      });
      setEditingWorker(null);
    } else {
      const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600', 'bg-cyan-600'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onAddWorker({
        name: workerName,
        code: workerCode,
        role: workerRole || 'کارگر فنی',
        phone: workerPhone,
        nationalId: workerNationalId,
        hourlyRate: Number(workerHourlyRate) || 100000,
        avatarColor: randomColor,
        status: 'active',
        joinedDate: new Date().toLocaleDateString('fa-IR'),
      });
    }

    // Reset
    setWorkerName('');
    setWorkerCode('');
    setWorkerRole('');
    setWorkerPhone('');
    setWorkerNationalId('');
    setShowAddWorkerModal(false);
  };

  const openEditWorker = (w: Worker) => {
    setEditingWorker(w);
    setWorkerName(w.name);
    setWorkerCode(w.code);
    setWorkerRole(w.role);
    setWorkerPhone(w.phone);
    setWorkerNationalId(w.nationalId || '');
    setWorkerHourlyRate(String(w.hourlyRate));
    setShowAddWorkerModal(true);
  };

  const handleManualAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWorkerId) return;
    onManualAttendance(manualWorkerId, manualType, manualTime, manualDate);
    setShowManualAttendanceModal(false);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetWorker = workers.find((w) => w.id === invWorkerId);
    if (!targetWorker) return;

    const regHrs = Number(invRegularHours) || 0;
    const ovtHrs = Number(invOvertimeHours) || 0;
    const bonus = Number(invBonus) || 0;
    const deductions = Number(invDeductions) || 0;
    const hourlyRate = targetWorker.hourlyRate;
    const ovtRate = Math.round(hourlyRate * 1.4);

    const total = regHrs * hourlyRate + ovtHrs * ovtRate + bonus - deductions;

    onCreateInvoice({
      workerId: targetWorker.id,
      workerName: targetWorker.name,
      workerCode: targetWorker.code,
      periodStart: invPeriodStart,
      periodEnd: invPeriodEnd,
      totalHours: regHrs + ovtHrs,
      regularHours: regHrs,
      overtimeHours: ovtHrs,
      hourlyRate,
      overtimeRate: ovtRate,
      bonus,
      deductions,
      totalAmount: Math.max(0, total),
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: 'draft',
    });

    setShowCreateInvoiceModal(false);
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.includes(searchQuery) ||
      w.code.includes(searchQuery) ||
      w.role.includes(searchQuery) ||
      w.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12" dir="rtl">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 overflow-x-auto">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            adminTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          داشبورد و آمار کارگاه
        </button>

        <button
          id="admin-tab-workers"
          onClick={() => setAdminTab('workers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            adminTab === 'workers'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          <Users className="w-4 h-4" />
          مدیریت کارگران ({workers.length})
        </button>

        <button
          onClick={() => setAdminTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            adminTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          ثبت ترددها ({attendanceRecords.length})
        </button>

        <button
          onClick={() => setAdminTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
            adminTab === 'invoices'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          فاکتورها و دستمزد ({invoices.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">کل پرسنل</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">{workers.length} نفر</div>
              <div className="text-[11px] text-emerald-400 mt-1">۱۰۰٪ ثبت شده</div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">حاضرین در کارگاه</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{workersInShift.length} نفر</div>
              <div className="text-[11px] text-slate-400 mt-1">شیفت فعال امروز</div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">ترددهای امروز</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{todayRecords.length} ثبت</div>
              <div className="text-[11px] text-slate-400 mt-1">ورود و خروج</div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">مجموع فاکتورها</span>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-purple-400">
                {new Intl.NumberFormat('fa-IR').format(Math.round(totalInvoicesAmount / 1000000))} م.ت
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{invoices.length} فیش حقوقی</div>
            </div>
          </div>

          {/* Active Workers Currently In Shift */}
          <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              پرسنل حاضر در شیفت کاری هم‌اکنون:
            </h3>

            {workersInShift.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                در حال حاضر پرسنلی در شیفت کاری ثبت نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {workersInShift.map((w) => (
                  <div key={w.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${w.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-sm`}>
                        {w.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{w.name}</div>
                        <div className="text-[11px] text-slate-400">{w.role} (کد {w.code})</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      مشغول کار
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Performance Bar Chart (SVG-based Clean Design) */}
          <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">آمار ساعات کارکرد هفتگی پرسنل</h3>
                <p className="text-xs text-slate-400 mt-0.5">مجموع نفر-ساعت ثبت شده در هفته جاری</p>
              </div>
              <span className="text-xs text-blue-400 font-semibold">میانگین: ۷.۸ ساعت/روز</span>
            </div>

            <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-700/60">
              {[
                { day: 'شنبه', hours: 38, percent: 85 },
                { day: 'یکشنبه', hours: 42, percent: 95 },
                { day: 'دوشنبه', hours: 40, percent: 90 },
                { day: 'سه‌شنبه', hours: 44, percent: 100 },
                { day: 'چهارشنبه', hours: 36, percent: 80 },
                { day: 'پنج‌شنبه', hours: 24, percent: 55 },
                { day: 'جمعه', hours: 0, percent: 0 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] text-slate-400 group-hover:text-blue-400 transition font-mono font-bold">
                    {item.hours > 0 ? `${item.hours}h` : '-'}
                  </span>
                  <div className="w-full max-w-[42px] bg-slate-800 rounded-t-xl overflow-hidden h-full flex items-end p-0.5">
                    <div
                      style={{ height: `${item.percent}%` }}
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:from-blue-500 group-hover:to-cyan-400 shadow-sm"
                    />
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium whitespace-nowrap">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKERS MANAGEMENT */}
      {adminTab === 'workers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/60 p-4 rounded-3xl">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجو با نام، کد پرسنلی یا سمت..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              id="admin-add-worker-btn"
              onClick={() => {
                setEditingWorker(null);
                setWorkerName('');
                setWorkerCode(String(workers.length + 101));
                setWorkerRole('');
                setWorkerPhone('');
                setWorkerNationalId('');
                setWorkerHourlyRate('120000');
                setShowAddWorkerModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              افزودن کارگر جدید
            </button>
          </div>

          {/* Workers Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-bold">کارگر</th>
                    <th className="py-3 px-4 font-bold">کد پرسنلی</th>
                    <th className="py-3 px-4 font-bold">سمت</th>
                    <th className="py-3 px-4 font-bold">تلفن همراه</th>
                    <th className="py-3 px-4 font-bold">نرخ ساعتی</th>
                    <th className="py-3 px-4 font-bold text-center">کارت QR</th>
                    <th className="py-3 px-4 font-bold text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredWorkers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg ${w.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-xs`}>
                            {w.name.slice(0, 1)}
                          </div>
                          <div>
                            <strong className="text-white block">{w.name}</strong>
                            <span className="text-[10px] text-slate-400">{w.joinedDate}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{w.code}</td>
                      <td className="py-3 px-4 text-slate-300">{w.role}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{w.phone}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                        {new Intl.NumberFormat('fa-IR').format(w.hourlyRate)} ت
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onOpenQRBadge(w)}
                          className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition cursor-pointer"
                          title="مشاهده و چاپ بارکد QR"
                        >
                          <QrCode className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditWorker(w)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`آیا از حذف کارگر «${w.name}» مطمئن هستید؟`)) {
                                onDeleteWorker(w.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE LOGS */}
      {adminTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/60 p-4 rounded-3xl">
            <div className="text-xs text-slate-300">
              مجموع کل ترددهای ثبت شده در سامانه: <strong className="text-white">{attendanceRecords.length} رکورد</strong>
            </div>

            <button
              onClick={() => setShowManualAttendanceModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              ثبت دستی تردد (ورود/خروج)
            </button>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-bold">نوع تردد</th>
                    <th className="py-3 px-4 font-bold">نام کارگر</th>
                    <th className="py-3 px-4 font-bold">کد</th>
                    <th className="py-3 px-4 font-bold">تاریخ</th>
                    <th className="py-3 px-4 font-bold">ساعت</th>
                    <th className="py-3 px-4 font-bold">روش ثبت</th>
                    <th className="py-3 px-4 font-bold text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {attendanceRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            r.type === 'check-in'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {r.type === 'check-in' ? 'ورود' : 'خروج'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{r.workerName}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{r.workerCode}</td>
                      <td className="py-3 px-4 text-slate-300">{r.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">{r.time}</td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400 text-[11px]">
                          {r.method === 'qr' ? 'اسکن QR بارکد' : 'ثبت مستقیم'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <button
                          onClick={() => onDeleteAttendance(r.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="حذف تردد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INVOICES & PAYROLL */}
      {adminTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/60 p-4 rounded-3xl">
            <div>
              <div className="text-xs text-slate-300">
                مجموع مطالبات فاکتورها: <strong className="text-emerald-400 font-bold">{new Intl.NumberFormat('fa-IR').format(totalInvoicesAmount)} تومان</strong>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">شامل ساعات کارکرد، اضافه‌کاری، پاداش و کسورات مصوب</div>
            </div>

            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-purple-600/30 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              صدور فاکتور جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-lg hover:border-blue-500/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-400">{inv.invoiceNumber}</span>
                      <h4 className="text-sm font-bold text-white mt-1">{inv.workerName} (کد {inv.workerCode})</h4>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : inv.status === 'approved'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {inv.status === 'paid' ? 'پرداخت شده' : inv.status === 'approved' ? 'تأیید شده' : 'پیش‌نویس'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">دوره کارکرد:</span>
                      <span className="text-slate-200 font-medium">{inv.periodStart} تا {inv.periodEnd}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">مجموع ساعات:</span>
                      <span className="text-slate-200 font-bold">{inv.totalHours} ساعت ({inv.overtimeHours} ساعت اضافه)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700/60 mt-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block">مبلغ قابل پرداخت:</span>
                    <strong className="text-sm text-emerald-400 font-mono">
                      {new Intl.NumberFormat('fa-IR').format(inv.totalAmount)} تومان
                    </strong>
                  </div>

                  <button
                    onClick={() => onViewInvoice(inv)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    مشاهده و چاپ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Worker */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingWorker ? 'ویرایش مشخصات کارگر' : 'افزودن کارگر جدید'}
            </h3>

            <form onSubmit={handleSaveWorker} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="مثال: حسین محمدی"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">کد پرسنلی:</label>
                  <input
                    type="text"
                    required
                    value={workerCode}
                    onChange={(e) => setWorkerCode(e.target.value)}
                    placeholder="مثال: 106"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">سمت / شغل:</label>
                  <input
                    type="text"
                    value={workerRole}
                    onChange={(e) => setWorkerRole(e.target.value)}
                    placeholder="مثال: تکنسین فنی"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">تلفن همراه:</label>
                  <input
                    type="text"
                    value={workerPhone}
                    onChange={(e) => setWorkerPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">کد ملی:</label>
                  <input
                    type="text"
                    value={workerNationalId}
                    onChange={(e) => setWorkerNationalId(e.target.value)}
                    placeholder="00123..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">نرخ دستمزد ساعتی (تومان):</label>
                <input
                  type="number"
                  required
                  value={workerHourlyRate}
                  onChange={(e) => setWorkerHourlyRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer"
                >
                  {editingWorker ? 'ذخیره تغییرات' : 'افزودن کارگر'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Manual Attendance Entry */}
      {showManualAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">ثبت دستی تردد توسط مدیریت</h3>

            <form onSubmit={handleManualAttendanceSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">انتخاب کارگر:</label>
                <select
                  value={manualWorkerId}
                  onChange={(e) => setManualWorkerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code} - {w.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">نوع تردد:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualType('check-in')}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      manualType === 'check-in'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ثبت ورود
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('check-out')}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      manualType === 'check-out'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ثبت خروج
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">ساعت:</label>
                  <input
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">تاریخ:</label>
                  <input
                    type="text"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                >
                  ثبت تردد
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualAttendanceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Invoice */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">صدور فاکتور و فیش حقوقی کارکرد</h3>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">انتخاب کارگر:</label>
                <select
                  value={invWorkerId}
                  onChange={(e) => setInvWorkerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (کد: {w.code} - ساعتی {new Intl.NumberFormat('fa-IR').format(w.hourlyRate)} ت)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">از تاریخ:</label>
                  <input
                    type="text"
                    value={invPeriodStart}
                    onChange={(e) => setInvPeriodStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">تا تاریخ:</label>
                  <input
                    type="text"
                    value={invPeriodEnd}
                    onChange={(e) => setInvPeriodEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">ساعات عادی (ساعت):</label>
                  <input
                    type="number"
                    value={invRegularHours}
                    onChange={(e) => setInvRegularHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">اضافه‌کاری (ساعت):</label>
                  <input
                    type="number"
                    value={invOvertimeHours}
                    onChange={(e) => setInvOvertimeHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">پاداش و مزایا (تومان):</label>
                  <input
                    type="number"
                    value={invBonus}
                    onChange={(e) => setInvBonus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">کسورات (تومان):</label>
                  <input
                    type="number"
                    value={invDeductions}
                    onChange={(e) => setInvDeductions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition cursor-pointer"
                >
                  ایجاد و محاسبه فاکتور
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

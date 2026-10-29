export interface Worker {
  id: string;
  code: string;
  name: string;
  role: string;
  phone: string;
  nationalId?: string;
  hourlyRate: number; // in Tomans / Currency unit
  avatarColor?: string;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  workerCode: string;
  type: 'check-in' | 'check-out';
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD or Solar/Persian
  time: string; // HH:mm
  method: 'qr' | 'manual';
  location?: string;
  notes?: string;
}

export interface WorkShift {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  durationMinutes: number;
  overtimeMinutes: number;
  hourlyRate: number;
  totalEarnings: number;
  status: 'in-progress' | 'completed';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  workerId: string;
  workerName: string;
  workerCode: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
  bonus: number;
  deductions: number;
  totalAmount: number;
  createdAt: string;
  status: 'draft' | 'approved' | 'paid';
}

export type ActiveTab = 'worker-portal' | 'admin-workers' | 'admin-attendance' | 'admin-invoices' | 'admin-analytics';

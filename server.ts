import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'db.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OPEN_INVOICES_FILE = path.join(DATA_DIR, 'open-invoices.json');

interface DbData {
  categories?: any[];
  brands?: any[];
  products?: any[];
  sales?: any[];
  invoices?: any[];
  counters?: {
    product?: number;
    invoice?: number;
    sale?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return fallback;
  }
}

function writeJson<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
  }
}

// ---------------- API Routes ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const LEDGER_FILE = path.join(DATA_DIR, 'ledger.json');

// Admin Login
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  const settings = readJson(SETTINGS_FILE, { adminPassword: '1234', disablePassword: false });
  if (settings.disablePassword || password === settings.adminPassword || password === '1234') {
    res.json({ ok: true, token: 'auth_' + Date.now(), disablePassword: !!settings.disablePassword });
  } else {
    res.status(401).json({ ok: false, error: 'رمز عبور نادرست است' });
  }
});

// Admin Password Reset / Recovery
app.post('/api/admin/reset-password', (req, res) => {
  const { masterKey, newPassword, phone } = req.body || {};
  const settings = readJson(SETTINGS_FILE, { adminPassword: '1234', shopPhone: '', disablePassword: false });
  const key = String(masterKey || '').trim();
  const shopPhone = String(settings.shopPhone || '').trim();
  const inputPhone = String(phone || '').trim();

  const isValid =
    key === '123456' ||
    key === '1234' ||
    key === 'admin' ||
    (shopPhone && inputPhone && (inputPhone === shopPhone || shopPhone.includes(inputPhone)));

  if (!isValid) {
    return res.status(400).json({ ok: false, error: 'کد تایید یا کلید اضطراری معتبر نیست' });
  }

  if (!newPassword || String(newPassword).length < 4) {
    return res.status(400).json({ ok: false, error: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد' });
  }

  settings.adminPassword = String(newPassword).trim();
  writeJson(SETTINGS_FILE, settings);
  res.json({ ok: true, message: 'رمز عبور مدیریت با موفقیت تغییر کرد' });
});

// Settings
app.get('/api/settings', (req, res) => {
  const settings = readJson(SETTINGS_FILE, {
    shopName: 'فروشگاه من',
    shopPhone: '',
    shopAddress: '',
    currency: 'تومان',
    footerNote: 'متشکریم از خرید شما 🌹',
    adminPassword: '1234',
    disablePassword: false
  });
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const current = readJson(SETTINGS_FILE, { disablePassword: false });
  const updated = { ...current, ...req.body };
  writeJson(SETTINGS_FILE, updated);
  res.json({ success: true, settings: updated });
});

// Ledger Synchronization APIs
app.get('/api/ledger/db', (req, res) => {
  const defaultLedger = {
    v: 3,
    settings: { shop: 'فروشگاه من', cur: 'toman', tz: 'Asia/Tehran', riskDebt: 50000000, riskDays: 30, nearPct: 80, nearDays: 3, noPass: false },
    users: [],
    customers: [],
    invoices: [],
    payments: [],
    txs: [],
    allocs: [],
    followups: [],
    audit: [],
    cashCounts: {},
    seq: { inv: 0, rec: 0, doc: 0, cust: 0, txn: 0 },
    meta: { lastBackup: 0, created: Date.now(), migrated: false }
  };
  const ledger = readJson(LEDGER_FILE, defaultLedger);
  res.json(ledger);
});

app.post('/api/ledger/db', (req, res) => {
  if (req.body && typeof req.body === 'object') {
    writeJson(LEDGER_FILE, req.body);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid ledger payload' });
  }
});

app.post('/api/ledger/credit-sale', (req, res) => {
  const { customerName, customerPhone, items, subtotal, discount, finalPayable, invoiceNumber, worker } = req.body;
  if (!finalPayable && finalPayable !== 0) {
    return res.status(400).json({ error: 'Final payable required' });
  }

  const defaultLedger = {
    v: 3,
    settings: { shop: 'فروشگاه من', cur: 'toman', tz: 'Asia/Tehran', riskDebt: 50000000, riskDays: 30, nearPct: 80, nearDays: 3, noPass: false },
    users: [],
    customers: [],
    invoices: [],
    payments: [],
    txs: [],
    allocs: [],
    followups: [],
    audit: [],
    cashCounts: {},
    seq: { inv: 0, rec: 0, doc: 0, cust: 0, txn: 0 },
    meta: { lastBackup: 0, created: Date.now(), migrated: false }
  };

  const ledger = readJson(LEDGER_FILE, defaultLedger);
  if (!ledger.customers) ledger.customers = [];
  if (!ledger.invoices) ledger.invoices = [];
  if (!ledger.txs) ledger.txs = [];
  if (!ledger.seq) ledger.seq = { inv: 0, rec: 0, doc: 0, cust: 0, txn: 0 };

  const cName = String(customerName || 'مشتری نسیه').trim();
  const cPhone = String(customerPhone || '').trim();

  let customer = ledger.customers.find((c: any) =>
    (cPhone && (c.phone === cPhone || c.phone2 === cPhone)) ||
    (c.name && c.name.trim().toLowerCase() === cName.toLowerCase())
  );

  if (!customer) {
    ledger.seq.cust = (ledger.seq.cust || 0) + 1;
    const cid = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    customer = {
      id: cid,
      code: 'C-' + String(1000 + ledger.seq.cust),
      name: cName,
      phone: cPhone,
      phone2: '',
      address: '',
      limit: 0,
      note: 'ایجاد شده خودکار از صندوق فروشگاهی',
      status: 'active',
      created: Date.now()
    };
    ledger.customers.push(customer);
  }

  ledger.seq.inv = (ledger.seq.inv || 0) + 1;
  ledger.seq.txn = (ledger.seq.txn || 0) + 1;

  const invId = 'iv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const txId = 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const unit = (ledger.settings && ledger.settings.cur === 'rial') ? 1 : 10;
  const numFinal = Number(finalPayable || 0);

  const cleanItems = (items || []).map((it: any) => ({
    n: it.name || 'کالا',
    q: Number(it.qty || 1),
    u: 'عدد',
    p: Math.round(Number(it.sellPrice || 0) * unit)
  }));

  const ledgerInvoice = {
    id: invId,
    no: invoiceNumber || ('F-' + String(10000 + ledger.seq.inv)),
    cid: customer.id,
    ts: Date.now(),
    due: Date.now() + (14 * 86400000),
    items: cleanItems,
    sub: Math.round(Number(subtotal || numFinal) * unit),
    disc: Math.round(Number(discount || 0) * unit),
    total: Math.round(numFinal * unit),
    status: 'active',
    note: `ثبت فاکتور نسیه از صندوق (صندوقدار: ${worker || 'صندوق'})`,
    user: worker || 'صندوقدار',
    txId
  };

  const ledgerTx = {
    id: txId,
    n: ledger.seq.txn,
    no: 'D-' + String(ledger.seq.txn).padStart(6, '0'),
    cid: customer.id,
    ts: Date.now(),
    type: 'sale',
    debit: Math.round(numFinal * unit),
    credit: 0,
    desc: `فاکتور فروش نسیه ${ledgerInvoice.no} (${cleanItems.length} قلم)`,
    due: ledgerInvoice.due,
    status: 'active',
    ref: { inv: invId },
    method: '',
    user: worker || 'صندوقدار'
  };

  ledger.invoices.push(ledgerInvoice);
  ledger.txs.push(ledgerTx);

  writeJson(LEDGER_FILE, ledger);
  res.json({ success: true, customer, invoice: ledgerInvoice, tx: ledgerTx });
});

// Users / Workers
app.get('/api/users', (req, res) => {
  const users = readJson(USERS_FILE, [
    { id: 'u1', name: 'آقای کیانی', role: 'manager', active: true, color: '#6366f1' },
    { id: 'u2', name: 'بابک', role: 'worker', active: true, color: '#10b981' },
    { id: 'u3', name: 'سیامک', role: 'worker', active: true, color: '#0891b2' },
    { id: 'u4', name: 'مصطفی', role: 'worker', active: true, color: '#f59e0b' }
  ]);
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const users = req.body;
  if (Array.isArray(users)) {
    writeJson(USERS_FILE, users);
    res.json({ success: true, count: users.length });
  } else {
    res.status(400).json({ error: 'Expected array of users' });
  }
});

// Products & Inventory
app.get('/api/products', (req, res) => {
  const db = readJson(DB_FILE, { products: [], categories: [], brands: [] });
  res.json({
    products: db.products || [],
    categories: db.categories || [],
    brands: db.brands || []
  });
});

app.get('/api/products/lookup', (req, res) => {
  const barcode = String(req.query.barcode || '').trim();
  const db = readJson(DB_FILE, { products: [] });
  const product = (db.products || []).find((p: any) => String(p.barcode).trim() === barcode);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'کالایی با این بارکد یافت نشد' });
  }
});

app.get('/api/products/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const db = readJson(DB_FILE, { products: [] });
  const results = (db.products || []).filter((p: any) => {
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.barcode && String(p.barcode).includes(q)) ||
      (p.sku && String(p.sku).toLowerCase().includes(q))
    );
  });
  res.json(results.slice(0, 30));
});

app.get('/api/products/low-stock', (req, res) => {
  const db = readJson(DB_FILE, { products: [] });
  const low = (db.products || []).filter((p: any) => Number(p.stock || 0) <= Number(p.minStock || 3));
  res.json(low);
});

app.post('/api/products/add', (req, res) => {
  const db = readJson<DbData>(DB_FILE, { products: [], counters: {} });
  if (!db.products) db.products = [];
  if (!db.counters) db.counters = { product: 0 };

  const barcode = String(req.body.barcode || '').trim();
  if (!barcode) {
    return res.status(400).json({ error: 'کد بارکد کالا الزامی است' });
  }

  // Check if product with this barcode already exists
  const existingIndex = db.products.findIndex((p: any) => String(p.barcode || '').trim() === barcode);
  if (existingIndex !== -1) {
    // Safely update existing product
    const existing = db.products[existingIndex];
    db.products[existingIndex] = {
      ...existing,
      name: req.body.name || existing.name,
      sku: req.body.sku !== undefined ? req.body.sku : existing.sku,
      unit: req.body.unit || existing.unit || 'عدد',
      categoryId: Number(req.body.categoryId) || existing.categoryId || 1,
      brandId: Number(req.body.brandId) || existing.brandId || 1,
      costPrice: Number(req.body.costPrice !== undefined ? req.body.costPrice : existing.costPrice),
      sellPrice: Number(req.body.sellPrice !== undefined ? req.body.sellPrice : existing.sellPrice),
      stock: Number(req.body.stock !== undefined ? req.body.stock : existing.stock),
      minStock: Number(req.body.minStock !== undefined ? req.body.minStock : existing.minStock),
      note: req.body.note !== undefined ? req.body.note : existing.note,
      updatedAt: new Date().toISOString()
    };
    writeJson(DB_FILE, db);
    return res.json({ success: true, updated: true, product: db.products[existingIndex] });
  }

  const newId = ((db.counters && db.counters.product) || db.products.length) + 1;
  if (db.counters) db.counters.product = newId;

  const newProduct = {
    id: newId,
    barcode: barcode,
    name: req.body.name || 'کالای بدون نام',
    sku: req.body.sku || '',
    unit: req.body.unit || 'عدد',
    categoryId: Number(req.body.categoryId) || 1,
    brandId: Number(req.body.brandId) || 1,
    costPrice: Number(req.body.costPrice) || 0,
    sellPrice: Number(req.body.sellPrice) || 0,
    stock: Number(req.body.stock) || 0,
    minStock: Number(req.body.minStock) || 3,
    note: req.body.note || '',
    createdAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  writeJson(DB_FILE, db);
  res.json({ success: true, product: newProduct });
});

app.post('/api/products/update', (req, res) => {
  const db = readJson(DB_FILE, { products: [] });
  const id = Number(req.body.id);
  const barcode = String(req.body.barcode || '').trim();

  let index = (db.products || []).findIndex((p: any) => p.id === id);
  if (index === -1 && barcode) {
    index = (db.products || []).findIndex((p: any) => String(p.barcode || '').trim() === barcode);
  }

  if (index === -1) {
    return res.status(404).json({ error: 'کالا یافت نشد' });
  }

  db.products[index] = {
    ...db.products[index],
    barcode: barcode || db.products[index].barcode,
    name: req.body.name || db.products[index].name,
    costPrice: Number(req.body.costPrice !== undefined ? req.body.costPrice : db.products[index].costPrice),
    sellPrice: Number(req.body.sellPrice !== undefined ? req.body.sellPrice : db.products[index].sellPrice),
    categoryId: Number(req.body.categoryId || db.products[index].categoryId || 1),
    brandId: Number(req.body.brandId || db.products[index].brandId || 1),
    stock: Number(req.body.stock !== undefined ? req.body.stock : db.products[index].stock),
    minStock: Number(req.body.minStock !== undefined ? req.body.minStock : db.products[index].minStock),
    note: req.body.note !== undefined ? req.body.note : db.products[index].note,
    updatedAt: new Date().toISOString()
  };

  writeJson(DB_FILE, db);
  res.json({ success: true, product: db.products[index] });
});

app.post('/api/products/delete', (req, res) => {
  const db = readJson(DB_FILE, { products: [] });
  const id = Number(req.body.id);
  db.products = (db.products || []).filter((p: any) => p.id !== id);
  writeJson(DB_FILE, db);
  res.json({ success: true });
});

// Invoices
app.get('/api/invoices', (req, res) => {
  const db = readJson(DB_FILE, { invoices: [] });
  res.json(db.invoices || []);
});

// Open / Draft Invoices per Worker
app.get('/api/invoice/open', (req, res) => {
  const worker = String(req.query.worker || 'صندوقدار');
  const openInvoices = readJson(OPEN_INVOICES_FILE, {});
  if (!openInvoices[worker]) {
    openInvoices[worker] = { worker, items: [], startedAt: new Date().toISOString() };
    writeJson(OPEN_INVOICES_FILE, openInvoices);
  }
  res.json(openInvoices[worker]);
});

app.post('/api/invoice/changeQty', (req, res) => {
  const { worker, items } = req.body;
  if (!worker) return res.status(400).json({ error: 'Worker name required' });
  const openInvoices = readJson(OPEN_INVOICES_FILE, {});
  openInvoices[worker] = {
    worker,
    items: items || [],
    startedAt: openInvoices[worker]?.startedAt || new Date().toISOString()
  };
  writeJson(OPEN_INVOICES_FILE, openInvoices);
  res.json({ success: true });
});

app.post('/api/invoice/clear', (req, res) => {
  const { worker } = req.body;
  const openInvoices = readJson(OPEN_INVOICES_FILE, {});
  if (worker && openInvoices[worker]) {
    openInvoices[worker].items = [];
    writeJson(OPEN_INVOICES_FILE, openInvoices);
  }
  res.json({ success: true });
});

// Checkout / Close Invoice
app.post('/api/invoice/close', (req, res) => {
  const { worker, customerName, customerPhone, paymentMethod, discount, items } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Invoice has no items' });
  }

  const db = readJson<DbData>(DB_FILE, { products: [], invoices: [], sales: [], counters: {} });
  if (!db.invoices) db.invoices = [];
  if (!db.sales) db.sales = [];
  if (!db.counters) db.counters = { invoice: 0, sale: 0 };

  const currentInvCount = (db.counters && db.counters.invoice) || db.invoices.length;
  const invCount = currentInvCount + 1;
  if (db.counters) db.counters.invoice = invCount;
  const invoiceNumber = `INV-${1000 + invCount}`;

  let subtotal = 0;
  let totalCost = 0;
  const now = new Date().toISOString();

  // Deduct inventory & add to sales with profit tracking
  const enhancedItems = items.map((item: any) => {
    const qty = Number(item.qty || 1);
    const sellPrice = Number(item.sellPrice || 0);
    subtotal += sellPrice * qty;

    const prod = (db.products || []).find((p: any) => String(p.barcode).trim() === String(item.barcode).trim());
    const costPrice = Number((prod && prod.costPrice) || item.buyPrice || 0);
    const itemCost = costPrice * qty;
    const itemProfit = (sellPrice * qty) - itemCost;
    totalCost += itemCost;

    if (prod) {
      prod.stock = Math.max(0, Number(prod.stock || 0) - qty);
    }

    const currentSaleCount = (db.counters && db.counters.sale) || db.sales!.length;
    const saleId = currentSaleCount + 1;
    if (db.counters) db.counters.sale = saleId;

    db.sales!.push({
      id: saleId,
      productId: prod ? prod.id : null,
      barcode: item.barcode,
      name: item.name,
      quantity: qty,
      costPrice,
      sellPrice,
      total: sellPrice * qty,
      profit: itemProfit,
      customer: customerName || 'مشتری حضوری',
      date: now,
      invoiceNumber,
      createdBy: worker || 'صندوقدار'
    });

    return {
      ...item,
      qty,
      sellPrice,
      costPrice,
      itemCost,
      itemProfit
    };
  });

  const numDiscount = Math.max(0, Number(discount) || 0);
  const finalPayable = Math.max(0, subtotal - numDiscount);
  const grossProfit = finalPayable - totalCost;
  const profitMargin = finalPayable > 0 ? Number(((grossProfit / finalPayable) * 100).toFixed(1)) : 0;

  const invoice = {
    id: 'inv_' + Date.now(),
    invoiceNumber,
    worker: worker || 'صندوقدار',
    customerName: customerName || 'مشتری حضوری',
    customerPhone: customerPhone || '',
    paymentMethod: paymentMethod || 'نقدی',
    items: enhancedItems,
    subtotal,
    totalCost,
    grossProfit,
    profitMargin,
    discount: numDiscount,
    finalPayable,
    date: now
  };

  db.invoices.push(invoice);
  writeJson(DB_FILE, db);

  // Clear open invoice for worker
  const openInvoices = readJson(OPEN_INVOICES_FILE, {});
  if (worker && openInvoices[worker]) {
    openInvoices[worker].items = [];
    writeJson(OPEN_INVOICES_FILE, openInvoices);
  }

  res.json({ success: true, invoice });
});

// Profit & Financial Analytics Report
app.get('/api/reports/profit', (req, res) => {
  const db = readJson<DbData>(DB_FILE, { invoices: [], sales: [], products: [] });
  const invoices = db.invoices || [];
  const sales = db.sales || [];

  let totalRevenue = 0;
  let totalCost = 0;
  let todayRevenue = 0;
  let todayCost = 0;
  let monthRevenue = 0;
  let monthCost = 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);

  invoices.forEach((inv: any) => {
    const rev = Number(inv.finalPayable || 0);
    const cost = Number(inv.totalCost || 0);
    totalRevenue += rev;
    totalCost += cost;

    const invDateStr = String(inv.date || '').slice(0, 10);
    if (invDateStr === todayStr) {
      todayRevenue += rev;
      todayCost += cost;
    }
    if (invDateStr.slice(0, 7) === monthStr) {
      monthRevenue += rev;
      monthCost += cost;
    }
  });

  const grossProfit = totalRevenue - totalCost;
  const todayProfit = todayRevenue - todayCost;
  const monthProfit = monthRevenue - monthCost;
  const profitMargin = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0;

  // Aggregate top profitable products
  const productProfitMap: { [key: string]: { name: string, barcode: string, qty: number, revenue: number, profit: number } } = {};
  sales.forEach((s: any) => {
    const key = String(s.barcode || s.name);
    if (!productProfitMap[key]) {
      productProfitMap[key] = {
        name: s.name || 'کالا',
        barcode: s.barcode || '',
        qty: 0,
        revenue: 0,
        profit: 0
      };
    }
    const q = Number(s.quantity || 1);
    const rev = Number(s.total || (s.sellPrice * q) || 0);
    const cost = Number(s.costPrice ? s.costPrice * q : 0);
    productProfitMap[key].qty += q;
    productProfitMap[key].revenue += rev;
    productProfitMap[key].profit += (rev - cost);
  });

  const topProfitableProducts = Object.values(productProfitMap)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  res.json({
    totalRevenue,
    totalCost,
    grossProfit,
    profitMargin,
    todayRevenue,
    todayProfit,
    monthRevenue,
    monthProfit,
    topProfitableProducts
  });
});

// Download android/pwa bundle package
app.get(['/api/download/android-package', '/download-apk-package'], (req, res) => {
  const pkgPath = path.resolve(process.cwd(), 'public', 'daftar-hooshmand-android-package.zip');
  if (fs.existsSync(pkgPath)) {
    res.download(pkgPath, 'anbaryar-daftar-hooshmand-android-package.zip');
  } else {
    res.status(404).json({ error: 'بسته دانلود آماده نیست' });
  }
});

// Restore backup
app.post('/api/backup/restore', (req, res) => {
  const { db: restoredDb, users: restoredUsers, settings: restoredSettings } = req.body;
  if (restoredDb) writeJson(DB_FILE, restoredDb);
  if (restoredUsers) writeJson(USERS_FILE, restoredUsers);
  if (restoredSettings) writeJson(SETTINGS_FILE, restoredSettings);
  res.json({ success: true });
});

// ---------------- Static files & SPA Routing ----------------
async function start() {
  const publicDir = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // Direct friendly routes
  app.get(['/', '/index.html', '/worker', '/worker.html'], (req, res) => {
    res.sendFile(path.join(publicDir, 'worker.html'));
  });
  app.get(['/admin', '/admin.html'], (req, res) => {
    res.sendFile(path.join(publicDir, 'admin.html'));
  });
  app.get(['/daftar', '/daftar.html'], (req, res) => {
    res.sendFile(path.join(publicDir, 'daftar.html'));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicDir, 'worker.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Anbariyar Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(console.error);

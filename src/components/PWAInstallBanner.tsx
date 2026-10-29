import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, CheckCircle, Share2, PlusSquare, Copy, ExternalLink, X, ShieldCheck, Zap, WifiOff } from 'lucide-react';

interface PWAInstallBannerProps {
  variant?: 'banner' | 'button';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ variant = 'banner' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* If variant is button (for header) */}
      {variant === 'button' && (
        <button
          id="pwa-install-header-btn"
          onClick={handleInstallClick}
          className="relative group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
          title="نصب اپلیکیشن روی موبایل یا راهنمای خروجی APK"
        >
          <Smartphone className="w-4 h-4 animate-pulse text-blue-200" />
          <span className="hidden sm:inline">نصب روی موبایل / PWA</span>
          <span className="sm:hidden">نصب PWA</span>
          {isInstalled && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>
      )}

      {/* Top Banner on mobile or desktop if not running in standalone */}
      {variant === 'banner' && !isInstalled && (
        <div id="pwa-top-callout" className="bg-gradient-to-r from-blue-900/60 via-slate-800/80 to-indigo-900/60 border-b border-blue-500/30 px-3 py-2 text-xs flex items-center justify-between gap-2 text-slate-200">
          <div className="flex items-center gap-2 truncate">
            <div className="p-1 rounded-lg bg-blue-600/30 text-blue-400 flex-shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">
              دسترسی سریع‌تر: <strong className="text-white font-medium">نصب اپلیکیشن روی گوشی (PWA / خروجی APK)</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition shadow-sm cursor-pointer"
            >
              راهنما و نصب
            </button>
          </div>
        </div>
      )}

      {/* Modal with detailed installation options and APK generation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div
            id="pwa-install-modal"
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-5 md:p-6 text-slate-200"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <img src="/pwa-192x192.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow-md border border-blue-500/30" />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    نصب اپلیکیشن روی موبایل
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      PWA & APK
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    دسترسی آسان، کارکرد بدون اینترنت و عملکرد سریع مشابه اپلیکیشن‌های بومی
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Trigger button if available */}
            {isInstallable && (
              <div className="mb-5 p-3.5 rounded-xl bg-blue-600/15 border border-blue-500/40 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">نصب با یک کلیک (توصیه گوگل)</div>
                  <div className="text-xs text-blue-200/80 mt-0.5">مرورگر شما از نصب مستقیم پشتیبانی می‌کند.</div>
                </div>
                <button
                  onClick={async () => {
                    const ok = await install();
                    if (ok) setShowModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  نصب مستقیم
                </button>
              </div>
            )}

            {/* Features badges */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
                <Zap className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <span className="text-[11px] font-medium text-slate-300 block">سبک و پرسرعت</span>
                <span className="text-[10px] text-slate-400">کمتر از ۱ مگابایت</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
                <WifiOff className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                <span className="text-[11px] font-medium text-slate-300 block">پشتیبانی آفلاین</span>
                <span className="text-[10px] text-slate-400">سرویس‌ورکر فعال</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
                <ShieldCheck className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                <span className="text-[11px] font-medium text-slate-300 block">امن و استاندارد</span>
                <span className="text-[10px] text-slate-400">بدون نیاز به دسترسی خاص</span>
              </div>
            </div>

            {/* Tabs / Guides */}
            <div className="space-y-4">
              {/* Android Guide */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/70">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">۱</span>
                  روش نصب در اندروید (کروم، سامسونگ اینترنت، فایرفاکس)
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 pr-8 list-decimal">
                  <li>در مرورگر موبایل، روی منوی سه نقطه (<strong className="text-white">⋮</strong>) در گوشه بالای صفحه بزنید.</li>
                  <li>گزینه <strong className="text-emerald-300">«افزودن به صفحه اصلی» (Add to Home screen)</strong> یا <strong className="text-emerald-300">«نصب برنامه» (Install app)</strong> را لمس کنید.</li>
                  <li>آیکون برنامه بلافاصله به لیست برنامه‌ها و صفحه گوشی شما اضافه می‌شود و بدون نوار آدرس مثل اپلیکیشن بومی اجرا خواهد شد.</li>
                </ol>
              </div>

              {/* iOS Guide */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/70">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">۲</span>
                  روش نصب در آیفون / آیپد (سافاری iOS)
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 pr-8 list-decimal">
                  <li>صفحه را در مرورگر <strong className="text-white">Safari</strong> باز کنید.</li>
                  <li>دکمه اشتراک‌گذاری (<Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> <strong className="text-white">Share</strong>) در نوار پایین مرورگر را بزنید.</li>
                  <li>به پایین اسکرول کرده و روی گزینه <strong className="text-blue-300">«Add to Home Screen» (<PlusSquare className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> افزودن به صفحه اصلی)</strong> ضربه بزنید.</li>
                </ol>
              </div>

              {/* APK Generation Guide */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-purple-500/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-300 mb-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">۳</span>
                  دریافت مستقیم فایل نصبی APK برای اندروید
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  چون این سامانه به طور ۱۰۰٪ استانداردهای رسمی PWA و Manifest را دارد، می‌توانید با ابزار رسمی <strong className="text-white">PWABuilder (مایکروسافت)</strong> یا <strong className="text-white">Bubblewrap (گوگل)</strong> تنها با وارد کردن آدرس سایت، فایل مستقیم <strong className="text-purple-300">.apk</strong> یا پکیج قابل انتشار در بازار/گوگل‌پلی را بسازید:
                </p>

                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 mb-3">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="bg-transparent text-xs text-slate-300 w-full outline-none select-all font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 transition"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'کپی شد!' : 'کپی'}
                  </button>
                </div>

                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  باز کردن سازنده آنلاین فایل APK (PWABuilder)
                </a>
              </div>
            </div>

            {/* Footer close */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              >
                بستن راهنما
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

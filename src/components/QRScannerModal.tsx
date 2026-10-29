import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, Check, Keyboard, ShieldAlert } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'اسکن بارکد و QR کد پرسنلی',
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setCameraError(null);

    // Initialize html5-qrcode
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back camera on mobile
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
          const targetCamId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(targetCamId);
          startScanning(targetCamId);
        } else {
          setCameraError('دوربینی در دستگاه یافت نشد. می‌توانید کد را به صورت دستی وارد کنید.');
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration error:', err);
        setCameraError('دسترسی به دوربین توسط مرورگر مسدود شده است یا در دسترس نیست. لطفا مجوز دوربین را تایید نمایید یا کد را دستی وارد کنید.');
      });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanning = async (cameraId: string) => {
    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Play beep / vibrate if supported
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(100);
          }
          stopScanner();
          onScanSuccess(decodedText);
          onClose();
        },
        () => {
          // Frame scan error - ignore frame by frame
        }
      );
      setIsScanning(true);
      setCameraError(null);
    } catch (err: unknown) {
      console.warn('Failed to start camera:', err);
      const message = err instanceof Error ? err.message : String(err);
      setCameraError('خطا در باز کردن دوربین: ' + message);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    startScanning(nextCamera.id);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopScanner();
      onScanSuccess(manualCode.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative p-4 flex-1 flex flex-col items-center justify-center bg-black/40 min-h-[300px]">
          {/* html5-qrcode reader div */}
          <div
            id={readerElementId}
            className="w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-blue-500/50 relative shadow-inner"
          />

          {/* Target Overlay Corner lines */}
          {isScanning && (
            <div className="absolute pointer-events-none w-56 h-56 border-2 border-blue-400/80 rounded-2xl flex items-center justify-center">
              <div className="w-full h-0.5 bg-blue-400 shadow-[0_0_12px_#38bdf8] animate-pulse" />
            </div>
          )}

          {/* Camera switch button if multiple cameras */}
          {cameras.length > 1 && isScanning && (
            <button
              onClick={switchCamera}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تغییر دوربین
            </button>
          )}

          {/* Error Message */}
          {cameraError && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 w-full max-w-sm">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{cameraError}</div>
            </div>
          )}
        </div>

        {/* Manual Code Input Fallback */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5 font-medium">
            <Keyboard className="w-3.5 h-3.5 text-blue-400" />
            ورود دستی شماره پرسنلی یا کد QR:
          </div>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="مثال: 101 یا w-101"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              ثبت
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

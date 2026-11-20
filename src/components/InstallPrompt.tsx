import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, CheckCircle, ExternalLink, HelpCircle, Copy } from 'lucide-react';
import { downloadSenseiApk } from '../utils/apkDownloader';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed as APK/PWA)
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // 2. Check if running inside an iframe (e.g. AI Studio preview)
    const insideIframe = window.self !== window.top;
    setIsIframe(insideIframe);

    // 3. Listen for Android Chrome PWA beforeinstallprompt event
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__deferredInstallPrompt = e;
      if (!standaloneMode) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for custom trigger from any button in the app (e.g. Header button)
    const manualTriggerHandler = () => {
      window.dispatchEvent(new CustomEvent('open-apk-download'));
    };
    window.addEventListener('open-install-prompt', manualTriggerHandler);

    // Auto-show banner after 1.8 seconds if not installed and not dismissed in current session
    const isDismissed = sessionStorage.getItem('sensei_pwa_dismissed') === 'true';
    if (!standaloneMode && !isDismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1800);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('open-install-prompt', manualTriggerHandler);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('open-install-prompt', manualTriggerHandler);
    };
  }, [deferredPrompt]);

  const triggerNativePrompt = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShowBanner(false);
          setShowGuideModal(false);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('PWA prompt execution note:', err);
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadMb, setDownloadMb] = useState('');

  const handleDownloadBlobApk = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    setDownloadProgress(5);
    setDownloadMb('0 / 51.7 MB');

    const ok = await downloadSenseiApk((pct, rec, total) => {
      setDownloadProgress(pct);
      setDownloadMb(`${rec} / ${total} MB`);
    });

    setIsDownloading(false);
    if (ok) {
      setDownloadSuccess(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('sensei_pwa_dismissed', 'true');
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  // If already installed as full APK / Standalone, don't display prompt banner
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* 1. Sleek Floating Bottom / Mobile Banner */}
      {showBanner && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#140D24]/95 backdrop-blur-xl border border-[#00F0FF]/40 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(0,240,255,0.25)] flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00F0FF] to-[#7928CA] p-0.5 flex-shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                  <div className="w-full h-full bg-[#0D0814] rounded-[10px] flex items-center justify-center">
                    <Smartphone className="text-[#00F0FF]" size={22} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-white font-extrabold text-sm sm:text-base tracking-wide">
                      Sensei'yi Telefona Yükle
                    </h4>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 rounded">
                      Mobil
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs mt-0.5 leading-snug">
                    Uygulamayı telefonuna yükle; tam ekran, internetsiz ve gerçek mobil uygulama olarak kullan.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="pt-1 border-t border-white/10">
              <button
                onClick={(e) => {
                  if (deferredPrompt) {
                    e.preventDefault();
                    triggerNativePrompt();
                  } else {
                    setShowGuideModal(true);
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-[#00F0FF] to-[#00A3FF] hover:from-[#38f4ff] hover:to-[#1cb0ff] text-black font-black text-sm rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Smartphone size={18} className="stroke-[2.5]" />
                <span>Uygulamayı Yükle / Kur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Step-by-Step Android / iOS APK Installation Modal Guide */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#170E2B] border border-[#00F0FF]/40 rounded-3xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(0,240,255,0.25)] relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00F0FF] to-[#7928CA] flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                <Smartphone size={26} className="text-black" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-lg">Uygulamayı Telefona İndir</h3>
                <p className="text-xs text-[#00F0FF] font-medium">Otomatik WebAPK & PWA Kurulumu</p>
              </div>
            </div>

            <p className="text-gray-300 text-xs sm:text-sm mb-5 leading-relaxed">
              SenSey bir web sitesi gibi değil; telefonuna tek tıkla yüklenen, internet tarayıcısının adres çubuğunu gizleyen ve ana ekranına ikon koyan <strong>tam teşekküllü bir mobil uygulamadır</strong>.
            </p>

            {/* Direct APK File Download Button (Primary) */}
            <div className="mb-3 space-y-2">
              <button
                type="button"
                onClick={handleDownloadBlobApk}
                disabled={isDownloading}
                className="w-full py-4 bg-gradient-to-r from-[#58cc02] via-[#46a302] to-[#2ea043] hover:brightness-110 text-white font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(88,204,2,0.4)] active:scale-98 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
              >
                {isDownloading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>İndiriliyor: %{downloadProgress} ({downloadMb || 'Hafızaya aktarılıyor...'})</span>
                  </div>
                ) : (
                  <>
                    <Smartphone size={20} className="stroke-[2.5]" />
                    <span>Sensei.apk İndir (Gerçek Paket - 17.4 MB)</span>
                  </>
                )}
              </button>

              {isDownloading && (
                <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-white/10">
                  <div 
                    className="bg-gradient-to-r from-[#00F0FF] to-[#58cc02] h-full transition-all duration-200"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              )}

              {downloadSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs text-center font-bold">
                  ✓ Sensei.apk hafızaya başarıyla kaydedildi! İndirilenler klasöründen dokunup kurabilirsiniz.
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const directUrl = window.location.origin + '/Sensei.apk';
                  navigator.clipboard?.writeText(directUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 3000);
                }}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-semibold rounded-lg border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy size={13} className="text-[#00F0FF]" />
                <span>{copiedLink ? '✓ İndirme Linki Kopyalandı! Chrome adres çubuğuna yapıştırabilirsiniz.' : 'Doğrudan İndirme Linkini Kopyala'}</span>
              </button>

              <p className="text-[11px] text-gray-400 text-center mt-1">
                İnternetsiz çalışan, telefona tam kurulan gerçek Android APK paketi.
              </p>
            </div>

            {/* Direct Prompt button if available */}
            {deferredPrompt && (
              <div className="mb-4">
                <button
                  onClick={triggerNativePrompt}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-[#00F0FF] border border-[#00F0FF]/30 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>Veya Tarayıcıdan Hızlıca Yükle (PWA)</span>
                </button>
              </div>
            )}

            {/* If in iframe / preview */}
            {isIframe && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <div className="text-xs text-amber-200 leading-snug">
                  Şu anda test penceresindesiniz. Telefonunuza doğrudan APK olarak yüklemek için canlı sekmede açıp indirebilirsiniz:
                  <button
                    onClick={handleOpenInNewTab}
                    className="mt-2 w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg border border-amber-500/40 flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink size={14} />
                    Yeni Sekmede Aç ve İndir
                  </button>
                </div>
              </div>
            )}

            {/* Manual Instructions for Android & iOS */}
            <div className="space-y-3 bg-[#0D0814]/80 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
                <span>🤖</span>
                <span>Android Chrome ile İndirme (2 Saniye):</span>
              </div>
              
              <div className="space-y-2 text-xs text-gray-300 pl-1">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                  <span>Chrome'un sağ üst köşesindeki <strong>üç nokta (⋮)</strong> menüsüne dokunun.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                  <span><strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçeneğine basın.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                  <span>Telefonunuz uygulamayı otomatik olarak APK gibi ana ekranınıza ve menünüze yerleştirir!</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

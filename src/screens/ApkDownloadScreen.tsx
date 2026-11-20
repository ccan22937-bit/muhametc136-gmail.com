import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, Download, CheckCircle2, Sparkles, Smartphone, AlertTriangle, Copy } from 'lucide-react';
import senseiAppIcon from '../assets/images/sensei_app_icon_1790270320445.jpg';
import { downloadSenseiApk } from '../utils/apkDownloader';

interface ApkDownloadScreenProps {
  onBack: () => void;
}

export function ApkDownloadScreen({ onBack }: ApkDownloadScreenProps) {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [isIframe, setIsIframe] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  const triggerWebApkInstall = async () => {
    const promptEvent = (window as any).__deferredInstallPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          (window as any).__deferredInstallPrompt = null;
        }
      } catch (e) {
        console.warn('Install prompt error:', e);
      }
    } else if (isIframe) {
      window.open(window.location.href, '_blank');
    } else {
      alert("Chrome'da sağ üstteki 3 nokta (⋮) menüsüne dokunup 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle' seçeneğine basarak anında kurabilirsiniz!");
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMb, setDownloadMb] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadBlobApk = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadProgress(5);
    setDownloadMb('0 / 51.7 MB');

    const ok = await downloadSenseiApk((pct, rec, total) => {
      setDownloadProgress(pct);
      setDownloadMb(`${rec} / ${total} MB`);
    });

    setIsDownloading(false);
    if (ok) {
      setDownloadStarted(true);
    } else {
      setDownloadError('İndirme tamamlanamadı, lütfen sayfayı yenileyip tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0814] text-white flex flex-col justify-between relative overflow-hidden pb-28">
      {/* Background neon glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7928CA]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00F0FF]/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between border-b border-white/5 bg-[#140D24]/70 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-semibold">Uygulamaya Dön</span>
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full text-xs text-[#00F0FF] font-bold">
          <Sparkles size={13} />
          <span>v2.4.0 Android WebAPK</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-lg mx-auto w-full px-5 py-6 flex flex-col items-center text-center">
        
        {/* Large App / Mascot Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#00F0FF] via-[#7928CA] to-[#FF0080] p-1 shadow-[0_0_40px_rgba(0,240,255,0.4)] mb-4"
        >
          <img
            src={senseiAppIcon}
            alt="Sensei"
            className="w-full h-full object-cover rounded-[22px]"
          />
        </motion.div>

        {/* Ready Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-extrabold mb-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <span>Resmi Android Uygulaması (WebAPK)</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Sensei
        </h1>
        <p className="text-gray-300 text-xs sm:text-sm max-w-md leading-relaxed mb-6">
          Telefonunuzda tam ekran, internetsiz ve hızlı çalışan resmi Sensei dil öğrenme uygulaması.
        </p>

        {/* ONE-CLICK INSTALL BUTTON */}
        <div className="w-full bg-gradient-to-b from-[#1E1136] to-[#140D24] border border-[#00F0FF]/30 rounded-2xl p-4 sm:p-5 mb-5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-[#00F0FF] font-extrabold text-sm sm:text-base mb-1.5">
            <Smartphone size={18} className="shrink-0 text-[#00F0FF]" />
            <span>Sensei Gerçek Android APK Paketi</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed mb-4">
            Doğrudan Android işletim sistemine kurulan, çevrimdışı sesli sohbet destekli 51 MB tam paket.
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleDownloadBlobApk}
              disabled={isDownloading}
              className="w-full py-4 px-4 bg-gradient-to-r from-[#58cc02] via-[#46a302] to-[#2ea043] hover:brightness-110 text-white font-black text-sm sm:text-base rounded-2xl shadow-[0_0_30px_rgba(88,204,2,0.45)] hover:scale-[1.01] active:scale-98 transition flex items-center justify-center gap-2.5 cursor-pointer text-center disabled:opacity-75"
            >
              {isDownloading ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>İndiriliyor: %{downloadProgress} ({downloadMb || 'Hafızaya aktarılıyor...'})</span>
                </div>
              ) : (
                <>
                  <Download size={20} className="stroke-[2.5]" />
                  <span>SENSEI.APK İNDİR (17.4 MB - HAFİF VE HIZLI)</span>
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

            {downloadError && (
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center">
                {downloadError}
              </div>
            )}

            {downloadStarted && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs text-center font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>Sensei.apk başarıyla kaydedildi! Dosyalarım/İndirilenler alanından dokunup kurabilirsiniz.</span>
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
          </div>
        </div>

        {/* Step-by-Step Installation Guide */}
        <div className="w-full bg-[#140D24]/90 border border-white/10 rounded-2xl p-4 text-left space-y-3.5 shadow-xl">
          <div className="text-xs font-black uppercase text-gray-400 tracking-wider mb-1">
            Manuel Kurulum Adımları:
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="text-white text-xs sm:text-sm font-bold">Chrome Menüsünü Açın</h4>
              <p className="text-gray-400 text-[11px] sm:text-xs mt-0.5 leading-snug">
                Chrome tarayıcınızın sağ üst köşesindeki <strong>üç nokta (⋮)</strong> simgesine dokunun.
              </p>
            </div>
          </div>

          <div className="border-t border-white/5" />

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="text-white text-xs sm:text-sm font-bold">"Uygulamayı Yükle" Seçeneğine Dokunun</h4>
              <p className="text-gray-400 text-[11px] sm:text-xs mt-0.5 leading-snug">
                Menüdeki <strong>"Uygulamayı Yükle"</strong> (veya <strong>"Ana Ekrana Ekle"</strong>) butonuna basın.
              </p>
            </div>
          </div>

          <div className="border-t border-white/5" />

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="text-white text-xs sm:text-sm font-bold">Sensei Ana Ekranınıza Yerleşsin</h4>
              <p className="text-gray-400 text-[11px] sm:text-xs mt-0.5 leading-snug">
                Android işletim sistemi Sensei'yi telefonunuza yükler ve ana ekranınızdan anında erişebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {downloadStarted && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#10B981] font-semibold bg-[#10B981]/10 px-4 py-2 rounded-xl border border-[#10B981]/20 animate-in fade-in">
            <CheckCircle2 size={15} />
            <span>Dosya indirme isteği yollandı.</span>
          </div>
        )}
      </div>

      {/* Fixed Bottom Download Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#140D24]/95 backdrop-blur-xl border-t border-[#00F0FF]/20 shadow-[0_-10px_30px_rgba(0,0,0,0.7)]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
              <ShieldCheck size={22} />
            </div>
            <div className="text-left">
              <h5 className="text-white font-extrabold text-sm leading-tight">Sensei</h5>
              <span className="text-gray-400 text-xs font-medium">Android Resmi Yükleme</span>
            </div>
          </div>

          <button
            onClick={triggerWebApkInstall}
            className="px-5 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] text-white font-black text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download size={18} />
            <span>UYGULAMAYI KUR</span>
          </button>
        </div>
      </div>
    </div>
  );
}

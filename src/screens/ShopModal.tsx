import React from 'react';
import { X, Gift, Heart, HelpCircle, Check, Star } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  hearts: number;
  stars: number;
  onClaimDailyGift: () => void;
  onBuyHeart: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  hearts,
  stars,
  onClaimDailyGift,
  onBuyHeart
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-100 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-base">
              🏪
            </div>
            <h2 className="text-lg font-black text-slate-900">Mağaza</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items List */}
        <div className="py-4 space-y-3">
          
          {/* Daily 5 Hearts Gift Card */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl flex-shrink-0">
                🎁
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">Günlük 5 Can Hediyesi</h3>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                    ÜCRETSİZ
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Her gün +5 can (Maks. 10)
                </p>
              </div>
            </div>

            <button
              onClick={onClaimDailyGift}
              disabled={hearts >= 10}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                hearts >= 10
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
              }`}
            >
              <span>{hearts >= 10 ? 'ALINDI' : 'AL'}</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1 Heart with Stars */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl flex-shrink-0 text-rose-500">
                ❤️
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">1 Can Al</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  5 Yıldız karşılığında
                </p>
              </div>
            </div>

            <button
              onClick={onBuyHeart}
              disabled={hearts >= 10 || stars < 5}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                hearts >= 10
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{hearts >= 10 ? 'DOLU' : '5 Yıldız'}</span>
            </button>
          </div>

          {/* Shop Rules Box */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-black text-sky-900">
              <span>💡</span>
              <span>Mağaza Kuralları</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
              <li>Maksimum 10 can ve 12 yıldız biriktirilebilir.</li>
              <li>Her ders galibiyetinde +1 yıldız kazanırsınız.</li>
              <li>5 yıldız vererek 1 can satın alabilirsiniz.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { X, Shield, Star, Award, Target, CheckCircle2, Crown, Lock } from 'lucide-react';
import crocodileIcon from '../assets/images/baby_crocodile_head_icon_1790450277976.jpg';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'ccan22937@gmail.com',
  userName = 'Cevdet Can'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-100 relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl p-0.5 bg-gradient-to-tr from-emerald-500 to-lime-400 border border-emerald-400 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={crocodileIcon}
                alt="Sensei"
                className="w-full h-full object-cover rounded-[8px]"
              />
            </div>
            <h2 className="text-lg font-black text-slate-900">Profil & Hesap</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-700 to-blue-900 border-4 border-white shadow-lg flex items-center justify-center text-white font-black text-3xl mb-2 relative">
            <span>C</span>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white">
              ✓
            </div>
          </div>

          <h3 className="text-xl font-black text-slate-900">{userName}</h3>
          <p className="text-xs text-slate-400 font-medium">{userEmail}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <span>🍃</span>
              <span>Seviye 1 • Timsah Çırağı</span>
            </span>

            <span className="bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-300 text-amber-950 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <span>👑</span>
              <span>KURUCU YÖNETİCİ</span>
            </span>
          </div>
        </div>

        {/* Statistics & Performance */}
        <div className="pt-2 pb-4">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-wide mb-3">
            <span>⚡</span>
            <span>İSTATİSTİKLER & PERFORMANS</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            
            {/* Card 1: 124 Cevaplanan Soru */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-center shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1 text-sm">
                🎯
              </div>
              <div className="text-xl font-black text-slate-900">124</div>
              <div className="text-[11px] text-slate-400 font-bold">Cevaplanan Soru</div>
            </div>

            {/* Card 2: 76% Başarı Oranı */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-center shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1 text-sm">
                🛡️
              </div>
              <div className="text-xl font-black text-emerald-600">76%</div>
              <div className="text-[11px] text-slate-400 font-bold">Başarı Oranı</div>
            </div>

            {/* Card 3: RU Rusça Kilitli Dil */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-center shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mx-auto mb-1 text-xs font-black">
                RU
              </div>
              <div className="text-base font-black text-slate-900 flex items-center justify-center gap-1">
                <span>Rusça</span>
              </div>
              <div className="text-[11px] text-slate-400 font-bold">Kilitli Dil 🔒</div>
            </div>

            {/* Card 4: ⭐ 11 Toplam Yıldız */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-center shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mx-auto mb-1 text-sm">
                ⭐
              </div>
              <div className="text-xl font-black text-amber-500">11</div>
              <div className="text-[11px] text-slate-400 font-bold">Toplam Yıldız</div>
            </div>

          </div>
        </div>

        {/* Admin Paneli Button */}
        <button className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-98">
          <Shield className="w-4 h-4" />
          <span>Admin Paneli (Kullanıcı İstatistikleri & Yönetim)</span>
        </button>

        {/* Uygulama İstatistikleri Box */}
        <div className="mt-4 p-4 bg-slate-900 rounded-2xl text-white">
          <div className="text-[11px] font-black text-slate-400 tracking-wider uppercase mb-2">
            UYGULAMA İSTATİSTİKLERİ
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-black text-emerald-400">18</div>
              <div className="text-[10px] text-slate-400">Toplam Ders</div>
            </div>
            <div>
              <div className="text-lg font-black text-amber-400">0</div>
              <div className="text-[10px] text-slate-400">Hata</div>
            </div>
            <div>
              <div className="text-lg font-black text-sky-400">2</div>
              <div className="text-[10px] text-slate-400">Aktif Seviye</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

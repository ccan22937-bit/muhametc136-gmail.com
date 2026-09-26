import React from 'react';
import { ArrowLeft, Star, Heart, Play, Lock } from 'lucide-react';
import crocodileStanding from '../assets/images/baby_crocodile_standing_1790450264500.jpg';

interface RoadmapScreenProps {
  stars: number;
  maxStars: number;
  hearts: number;
  maxHearts: number;
  onBack: () => void;
  onSelectLevel: (levelId: number) => void;
}

export const RoadmapScreen: React.FC<RoadmapScreenProps> = ({
  stars,
  maxStars,
  hearts,
  maxHearts,
  onBack,
  onSelectLevel
}) => {
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-28 max-w-md mx-auto">
      
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-black text-slate-900">
            Seviyeler & Yol Haritası
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{stars}/{maxStars}</span>
          </div>
          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-600 px-2 py-1 rounded-full text-xs font-bold">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>{hearts}/{maxHearts}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Memory Info Banner */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
          <span className="text-sm">⭐</span>
          <p className="font-semibold leading-relaxed">
            Her seviyenin kelimeleri hafızada saklanır. Dilediğin seviyeye tıkla ve pratik yap!
          </p>
        </div>

        {/* Level Path */}
        <div className="space-y-6 pt-2">
          
          {/* Level 1: Temel Tanışma */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectLevel(1)}
                className="w-14 h-14 rounded-2xl bg-lime-500 hover:bg-lime-600 text-white flex items-center justify-center shadow-md active:scale-95 transition flex-shrink-0"
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>

              <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl flex-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-slate-900">1. Seviye</h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Kayıtlı
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Temel Tanışma
                </p>
              </div>
            </div>

            {/* Mascot Character standing beside */}
            <div className="flex items-center gap-2 mt-4 ml-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-lime-300 p-0.5 bg-white shadow-sm flex-shrink-0">
                <img
                  src={crocodileStanding}
                  alt="Sensei"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs relative">
                <span>Pes etme, harikasın! 🐊</span>
              </div>
            </div>
          </div>

          {/* Level 2: Aile & İnsanlar */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectLevel(2)}
                className="w-14 h-14 rounded-2xl bg-lime-500 hover:bg-lime-600 text-white flex items-center justify-center shadow-md active:scale-95 transition flex-shrink-0"
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>

              <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl flex-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-slate-900">2. Seviye</h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    5 Kelime Kayıtlı
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Aile & İnsanlar
                </p>
              </div>
            </div>
          </div>

          {/* Level 3: Ev & Yaşam (Locked) */}
          <div className="relative opacity-85">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 border border-slate-300 text-slate-400 flex flex-col items-center justify-center shadow-2xs flex-shrink-0">
                <Lock className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold">10 ⭐</span>
              </div>

              <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl flex-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-600">3. Seviye</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    Kilitli
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Ev & Yaşam
                </p>
              </div>
            </div>

            {/* Mascot cheering */}
            <div className="flex items-center gap-2 mt-4 ml-14">
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs">
                <span>Pes etme! 🐊</span>
              </div>
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-300 p-0.5 bg-white shadow-sm flex-shrink-0">
                <img
                  src={crocodileStanding}
                  alt="Sensei"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Level 4: Seviye 4 (Locked) */}
          <div className="flex items-center gap-3 opacity-70">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 border border-slate-300 text-slate-400 flex flex-col items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>

            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl flex-1 shadow-2xs">
              <h3 className="font-bold text-sm text-slate-500">4. Seviye</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Seyahat & Ulaşım
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

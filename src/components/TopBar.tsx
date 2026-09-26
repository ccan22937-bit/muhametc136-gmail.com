import React from 'react';

interface TopBarProps {
  onLanguageChange?: (lang: string) => void;
}

export const TopBar: React.FC<TopBarProps> = () => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-3 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between gap-1 sm:gap-1.5">
        
        {/* Left: Crocodile Avatar Badge & TÜ -> RU */}
        <div className="flex items-center gap-1.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-0.5 bg-gradient-to-tr from-emerald-500 to-lime-400 border border-emerald-400 shadow-xs flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/src/assets/images/baby_crocodile_head_icon_1790450277976.jpg"
              alt="Sensei"
              className="w-full h-full object-cover rounded-[10px]"
            />
          </div>

          {/* TÜ -> RU Pill */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 text-slate-700 px-2.5 py-1.5 rounded-full text-xs font-bold shadow-2xs">
            <span className="text-slate-800 text-[11px]">TÜ</span>
            <span className="text-emerald-500 font-black text-[10px]">→</span>
            <span className="text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-full text-[11px]">
              RU
            </span>
          </div>
        </div>

        {/* Right Stats & Badges */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          
          {/* 👑 KURUCU */}
          <div className="flex items-center gap-1 bg-amber-50/70 border border-amber-200/90 text-amber-800 px-2 sm:px-2.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-wide shadow-2xs">
            <span>👑</span>
            <span>KURUCU</span>
          </div>

          {/* ⭐ 11/12 */}
          <div className="flex items-center gap-1 bg-amber-50/70 border border-amber-200/90 text-amber-600 px-2 sm:px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black shadow-2xs">
            <span>⭐</span>
            <span>11/12</span>
          </div>

          {/* ❤️ 10/10 */}
          <div className="flex items-center gap-1 bg-rose-50/70 border border-rose-200/90 text-rose-600 px-2 sm:px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black shadow-2xs">
            <span>❤️</span>
            <span>10/10</span>
          </div>

        </div>

      </div>
    </header>
  );
};

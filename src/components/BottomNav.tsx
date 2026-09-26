import React from 'react';
import { Home, Mic, Map, Type, Store, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 py-2.5 px-3 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        
        {/* 1. Home Button (Green outline rounded box) */}
        <button
          onClick={() => onTabChange('home')}
          className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition shadow-2xs ${
            currentTab === 'home'
              ? 'border-emerald-400 bg-emerald-50/50 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.4]" />
        </button>

        {/* 2. Big Green Solid Microphone Button */}
        <button
          onClick={() => onTabChange('voice')}
          className="w-12 h-12 rounded-full bg-lime-500 hover:bg-lime-600 text-white flex items-center justify-center shadow-md active:scale-95 transition"
        >
          <Mic className="w-6 h-6 stroke-[2.6]" />
        </button>

        {/* 3. Map / Book Icon */}
        <button
          onClick={() => onTabChange('lessons')}
          className={`p-2 transition ${
            currentTab === 'lessons' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Map className="w-6 h-6 stroke-[2]" />
        </button>

        {/* 4. Text 'T' Icon */}
        <button
          onClick={() => onTabChange('text')}
          className={`p-2 transition ${
            currentTab === 'text' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Type className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* 5. Store / Shop Icon */}
        <button
          onClick={() => onTabChange('shop')}
          className={`p-2 transition ${
            currentTab === 'shop' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Store className="w-6 h-6 stroke-[2]" />
        </button>

        {/* 6. Profile Icon */}
        <button
          onClick={() => onTabChange('profile')}
          className={`p-2 transition ${
            currentTab === 'profile' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-6 h-6 stroke-[2]" />
        </button>

      </div>
    </nav>
  );
};

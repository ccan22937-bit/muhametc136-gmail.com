import React, { useState } from 'react';
import { BookOpen, Headphones } from 'lucide-react';
import crocodileStanding from '../assets/images/baby_crocodile_standing_1790450264500.jpg';

interface HomeScreenProps {
  onStartLesson: (words: string[]) => void;
  onStartTest: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartLesson,
  onStartTest
}) => {
  const [words, setWords] = useState<string[]>(['', '', '', '', '']);

  const handleWordChange = (index: number, val: string) => {
    const next = [...words];
    next[index] = val;
    setWords(next);
  };

  const handleFillSample = () => {
    setWords(['Merhaba', 'Günaydın', 'Nasılsın', 'Teşekkürler', 'Görüşürüz']);
  };

  const handleStart = () => {
    const active = words.filter(w => w.trim().length > 0);
    if (active.length > 0) {
      onStartLesson(active);
    } else {
      onStartLesson(['Merhaba', 'Nasılsın', 'Teşekkürler']);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 px-4 pt-3 pb-28 max-w-md mx-auto">
      
      {/* 1. Mascot in Glowing Circular Ring with Shiny Star (Screenshot 3) */}
      <div className="flex flex-col items-center justify-center pt-2 pb-5">
        <div className="relative">
          
          {/* Glowing Circular Avatar Container */}
          <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-lime-300 via-emerald-400 to-green-300 shadow-md flex items-center justify-center relative">
            <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white flex items-center justify-center">
              <img
                src={crocodileStanding}
                alt="Sensei Maskot"
                className="w-full h-full object-contain p-1 scale-105"
              />
            </div>

            {/* Shiny Gold Star Badge at Top-Right */}
            <div className="absolute top-1 right-2 bg-gradient-to-tr from-amber-400 to-yellow-300 w-7 h-7 rounded-full shadow-md border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">✨</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Question Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/90 text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Bugün Hangi Kelimeleri Öğrenelim?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed">
          Öğrenmek istediğiniz kelimeleri Türkçe olarak yazın. (En az 3, <br className="hidden sm:inline" />
          En fazla 5 kelime)
        </p>
      </div>

      {/* 3. Subheader: Action Links Row */}
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          YENİ KELİMELER EKLE (İSTEĞE BAĞLI)
        </span>
        <button
          type="button"
          onClick={handleFillSample}
          className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-bold transition"
        >
          <BookOpen className="w-4 h-4 text-lime-600" />
          <span>Kayıtlı Kelimelerden Getir</span>
        </button>
      </div>

      {/* 4. The 5 Input Fields */}
      <div className="space-y-3 mb-5">
        {[1, 2, 3, 4, 5].map((num, idx) => (
          <div key={num}>
            <input
              type="text"
              value={words[idx]}
              onChange={(e) => handleWordChange(idx, e.target.value)}
              placeholder={`${num}. Kelime`}
              className="w-full bg-white border border-slate-200/90 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 text-sm font-semibold shadow-2xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        ))}
      </div>

      {/* 5. Bottom Action Buttons */}
      <div className="space-y-3">
        {/* Dersi Başlat */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl text-slate-700 hover:text-emerald-700 font-bold text-sm shadow-2xs transition active:scale-98 text-center"
        >
          Dersi Başlat
        </button>

        {/* 🎧 Öğrendiğim Kelimeleri Test Et */}
        <button
          onClick={onStartTest}
          className="w-full py-4 bg-white border border-emerald-300 hover:border-emerald-500 text-emerald-700 font-bold text-sm rounded-2xl shadow-2xs flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Headphones className="w-4 h-4 text-emerald-600" />
          <span>Öğrendiğim Kelimeleri Test Et</span>
        </button>
      </div>

    </div>
  );
};

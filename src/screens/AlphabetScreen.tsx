import React, { useState } from 'react';
import { X, Volume2 } from 'lucide-react';
import { playNativeSpeech } from '../utils/translator';

interface AlphabetScreenProps {
  onClose?: () => void;
  selectedLanguage?: string;
}

export const AlphabetScreen: React.FC<AlphabetScreenProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'kiril' | 'kelime'>('kiril');

  const CYRILLIC_ALPHABET = [
    { letter: 'А', sound: 'a', tr: 'a' },
    { letter: 'Б', sound: 'b', tr: 'be' },
    { letter: 'В', sound: 'v', tr: 've' },
    { letter: 'Г', sound: 'g', tr: 'ge' },
    { letter: 'Д', sound: 'd', tr: 'de' },
    { letter: 'Е', sound: 'ye', tr: 'ye' },
    { letter: 'Ё', sound: 'yo', tr: 'yo' },
    { letter: 'Ж', sound: 'zh', tr: 'je' },
    { letter: 'З', sound: 'z', tr: 'ze' },
    { letter: 'И', sound: 'i', tr: 'i' },
    { letter: 'Й', sound: 'y', tr: 'kısa i' },
    { letter: 'К', sound: 'k', tr: 'ka' },
    { letter: 'Л', sound: 'l', tr: 'el' },
    { letter: 'М', sound: 'm', tr: 'em' },
    { letter: 'Н', sound: 'n', tr: 'en' },
    { letter: 'О', sound: 'o', tr: 'o' },
    { letter: 'П', sound: 'p', tr: 'pe' },
    { letter: 'Р', sound: 'r', tr: 'er' },
    { letter: 'С', sound: 's', tr: 'es' },
    { letter: 'Т', sound: 't', tr: 'te' },
    { letter: 'У', sound: 'u', tr: 'u' },
    { letter: 'Ф', sound: 'f', tr: 'ef' },
    { letter: 'Х', sound: 'kh', tr: 'ha' },
    { letter: 'Ц', sound: 'ts', tr: 'tse' },
    { letter: 'Ч', sound: 'ch', tr: 'çe' },
    { letter: 'Ш', sound: 'sh', tr: 'şa' },
    { letter: 'Щ', sound: 'shch', tr: 'şça' },
    { letter: 'Ъ', sound: '"', tr: 'sert işaret' },
    { letter: 'Ы', sound: 'y', tr: 'ı' },
    { letter: 'Ь', sound: "'", tr: 'yumuşatma' },
    { letter: 'Э', sound: 'e', tr: 'e' },
    { letter: 'Ю', sound: 'yu', tr: 'yu' },
    { letter: 'Я', sound: 'ya', tr: 'ya' },
  ];

  const handleLetterClick = (letter: string) => {
    playNativeSpeech(letter, 'RU');
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between max-w-md mx-auto relative pb-28">
      
      {/* Top Tabs */}
      <div>
        <div className="flex items-center justify-center border-b border-slate-200">
          <button
            onClick={() => setActiveTab('kiril')}
            className={`flex-1 py-3 text-center text-xs font-black tracking-wider transition relative ${
              activeTab === 'kiril'
                ? 'text-emerald-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>KİRİL</span>
            {activeTab === 'kiril' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-lime-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('kelime')}
            className={`flex-1 py-3 text-center text-xs font-black tracking-wider transition relative ${
              activeTab === 'kelime'
                ? 'text-emerald-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>KELİME YAP</span>
            {activeTab === 'kelime' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-lime-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Title Header */}
        <div className="text-center py-4 px-4">
          <h2 className="text-lg font-black text-slate-900">
            Rusça (Rusya) öğrenelim!
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rusça (Rusya) alfabesini öğren
          </p>
        </div>

        {/* Letters Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5 px-4 pb-6">
          {CYRILLIC_ALPHABET.map((item, index) => (
            <button
              key={index}
              onClick={() => handleLetterClick(item.letter)}
              className="p-3 bg-white border border-slate-200/90 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center shadow-2xs hover:shadow-md transition active:scale-95 group"
            >
              <span className="text-xl font-black text-slate-900 group-hover:text-emerald-600">
                {item.letter}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {item.sound}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Close Button at Bottom */}
      {onClose && (
        <div className="flex justify-center pb-6">
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center shadow-lg transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

    </div>
  );
};

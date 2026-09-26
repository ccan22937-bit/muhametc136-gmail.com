import React, { useState } from 'react';
import { translateWord, playNativeSpeech, WordTranslation } from '../utils/translator';
import { Volume2, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Star, Heart } from 'lucide-react';
import crocodileIcon from '../assets/images/baby_crocodile_head_icon_1790450277976.jpg';

interface LessonPracticeScreenProps {
  words: string[];
  targetLang: 'RU' | 'EN' | 'DE' | 'ES' | 'FR' | 'JA';
  onComplete: (xpEarned: number, starsEarned: number) => void;
  onExit: () => void;
}

export const LessonPracticeScreen: React.FC<LessonPracticeScreenProps> = ({
  words,
  targetLang,
  onComplete,
  onExit
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const translatedWords: WordTranslation[] = words.map(w => translateWord(w, targetLang));
  const currentWord = translatedWords[currentIndex];

  const handleNext = () => {
    setShowAnswer(false);
    setUserGuess('');
    if (currentIndex + 1 < translatedWords.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleSpeak = (text: string) => {
    playNativeSpeech(text, targetLang);
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-emerald-400 p-2 mb-4 shadow-xl animate-bounce">
          <img
            src={crocodileIcon}
            alt="Sensei"
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-2">Harika İş Çıkardın! 🎉</h2>
        <p className="text-sm text-slate-500 mb-6">
          Seçtiğin {words.length} kelimeyi Sensei ile başarıyla tamamladın.
        </p>

        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-amber-500 font-black text-xl mb-1">
              <Star className="w-5 h-5 fill-amber-400" />
              <span>+1 Yıldız</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">İlerleme Puanı</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-black text-xl mb-1">
              <Sparkles className="w-5 h-5 fill-emerald-400" />
              <span>+{words.length * 10} XP</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Kazanılan Deneyim</span>
          </div>
        </div>

        <button
          onClick={() => onComplete(words.length * 10, 1)}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-98"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / translatedWords.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 max-w-md mx-auto">
      
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onExit}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 mx-4">
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500">
            {currentIndex + 1}/{translatedWords.length}
          </span>
        </div>

        {/* Word Flashcard */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mt-4 text-center">
          <div className="inline-block bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            Türkçe Kelime
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-2">
            {currentWord.tr}
          </h2>

          <div className="my-6 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {targetLang} Karşılığı
              </span>
              <button
                onClick={() => handleSpeak(currentWord.target)}
                className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 shadow-md active:scale-95 transition"
                title="Sesli Dinle"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-emerald-700">
              {currentWord.target}
            </h3>

            {currentWord.phonetic && (
              <p className="text-xs text-slate-400 italic mt-1">
                Okunuş: [{currentWord.phonetic}]
              </p>
            )}
          </div>

          {/* Example Sentence */}
          {currentWord.exampleTarget && (
            <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100 mt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Örnek Cümle:
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {currentWord.exampleTarget}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentWord.exampleTr}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="pt-4 pb-2">
        <button
          onClick={handleNext}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-98 transition"
        >
          <span>{currentIndex + 1 === translatedWords.length ? 'Dersi Bitir' : 'Sonraki Kelime'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

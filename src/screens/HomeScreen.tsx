import React from 'react';
import { UserStats, LessonUnit } from '../types';
import { Mascot } from '../components/Mascot';
import { Volume2, Check, Lock, Star, Sparkles, BookOpen, Flame, Trophy } from 'lucide-react';

interface HomeScreenProps {
  stats: UserStats;
  onStartLesson: (unitId: string, levelId: string) => void;
  onOpenGitHubModal: () => void;
  onOpenVoiceCoach?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stats,
  onStartLesson,
  onOpenVoiceCoach
}) => {
  const units: LessonUnit[] = [
    {
      id: 'unit-1',
      title: 'Ünite 1: Tanışma & Temel Cümleler',
      description: 'İlk kelimelerinizi ve selamlaşma kalıplarını öğrenin.',
      category: 'BAŞLANGIÇ (A1)',
      icon: '👋',
      color: 'from-emerald-500 to-teal-600',
      levels: [
        { id: 'l1-1', title: 'Merhaba ve Selamlaşma', type: 'drill', completed: true, xp: 20 },
        { id: 'l1-2', title: 'Kendini Tanıtma', type: 'hybrid', completed: true, xp: 20 },
        { id: 'l1-3', title: 'Temel Sorular (Kim, Ne, Nerede)', type: 'drill', completed: false, xp: 25 },
        { id: 'l1-4', title: 'Ünite 1 Değerlendirme & Boss', type: 'boss', completed: false, xp: 35 }
      ]
    },
    {
      id: 'unit-2',
      title: 'Ünite 2: Günlük Hayat & Kafede Sipariş',
      description: 'Restoranda sipariş verin, yol tarifi isteyin ve alışveriş yapın.',
      category: 'GÜNLÜK PRATİK (A1-A2)',
      icon: '☕',
      color: 'from-cyan-500 to-blue-600',
      levels: [
        { id: 'l2-1', title: 'Kafede Kahve & Yiyecek İsteme', type: 'hybrid', completed: false, xp: 25 },
        { id: 'l2-2', title: 'Hesap İsteme ve Nezaket Kalıpları', type: 'drill', completed: false, xp: 25 },
        { id: 'l2-3', title: 'Yol Tarifi ve Konum Bildirme', type: 'drill', completed: false, xp: 30 }
      ]
    },
    {
      id: 'unit-3',
      title: 'Ünite 3: Seyahat & Havalimanı',
      description: 'Uçak bileti, otel rezervasyonu ve pasaport kontrolü.',
      category: 'SEYAHAT (A2)',
      icon: '✈️',
      color: 'from-indigo-500 to-purple-600',
      levels: [
        { id: 'l3-1', title: 'Havalimanı & Check-in', type: 'hybrid', completed: false, xp: 30 },
        { id: 'l3-2', title: 'Otel Girişi & Oda İsteme', type: 'drill', completed: false, xp: 30 }
      ]
    }
  ];

  return (
    <div className="p-4 pb-28 max-w-xl mx-auto space-y-6">
      
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/70 border border-emerald-500/30 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3 flex-1 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemma 3 Destekli Sensei</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Bugünkü Hedefine <br />
                <span className="text-emerald-400">1 Alıştırma</span> Kaldı!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                Sensei ile hibrit cümle pratiği yaparak serini koru.
              </p>
            </div>

            <button
              onClick={() => onOpenVoiceCoach && onOpenVoiceCoach()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Sesli Koçla Konuş</span>
            </button>
          </div>

          <div className="relative flex-shrink-0">
            <Mascot size="lg" mood="teaching" speechBubble="Hazır mısın?" />
          </div>
        </div>
      </div>

      {/* Units & Levels Path */}
      {units.map((unit) => (
        <div key={unit.id} className="space-y-4">
          
          {/* Unit Header Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-5 text-white shadow-xl shadow-emerald-950/30">
            <span className="text-[11px] font-black tracking-wider text-emerald-100 uppercase opacity-90">
              {unit.category}
            </span>
            <h3 className="text-lg font-black mt-0.5 flex items-center gap-2">
              <span>{unit.title}</span>
            </h3>
            <p className="text-xs text-emerald-50 mt-1 opacity-90">
              {unit.description}
            </p>
          </div>

          {/* Duolingo-style Winding Road */}
          <div className="flex flex-col items-center py-4 space-y-7">
            {unit.levels.map((lvl, index) => {
              const isCompleted = stats.completedLessons.includes(lvl.id) || lvl.completed;
              const isAvailable = index === 0 || stats.completedLessons.includes(unit.levels[index - 1]?.id) || lvl.completed;

              // Alternating curved offset for Duolingo path
              const offsets = ['translate-x-0', 'translate-x-8', '-translate-x-8', 'translate-x-4'];
              const offsetClass = offsets[index % offsets.length];

              return (
                <div key={lvl.id} className={`flex flex-col items-center ${offsetClass} transition-transform`}>
                  <button
                    onClick={() => isAvailable && onStartLesson(unit.id, lvl.id)}
                    disabled={!isAvailable}
                    className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black transition-all shadow-xl active:scale-95 ${
                      isCompleted
                        ? 'bg-gradient-to-b from-amber-400 to-amber-500 border-4 border-amber-300 text-slate-950 shadow-amber-500/30'
                        : isAvailable
                        ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 border-4 border-emerald-300 text-slate-950 animate-bounce-subtle shadow-emerald-500/30'
                        : 'bg-slate-800 border-4 border-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-8 h-8 stroke-[3.5]" />
                    ) : isAvailable ? (
                      <Star className="w-8 h-8 fill-slate-950 stroke-[2]" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}

                    {/* Badge Under the Level Button */}
                    <div className="absolute -bottom-2 bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap shadow-md">
                      +{lvl.xp} XP
                    </div>
                  </button>

                  <span className="text-xs font-bold text-slate-200 mt-3 text-center max-w-[140px] drop-shadow-sm">
                    {lvl.title}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      ))}

    </div>
  );
};

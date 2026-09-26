import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { VoiceCoachScreen } from './screens/VoiceCoachScreen';
import { AlphabetScreen } from './screens/AlphabetScreen';
import { RoadmapScreen } from './screens/RoadmapScreen';
import { LessonPracticeScreen } from './screens/LessonPracticeScreen';
import { ShopModal } from './screens/ShopModal';
import { ProfileModal } from './screens/ProfileModal';
import { startNotificationScheduler } from './utils/notifications';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeWords, setActiveWords] = useState<string[] | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [stars, setStars] = useState(11);
  const [maxStars, setMaxStars] = useState(12);
  const [hearts, setHearts] = useState(10);
  const [maxHearts, setMaxHearts] = useState(10);

  useEffect(() => {
    startNotificationScheduler();
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'shop') {
      setIsShopOpen(true);
      return;
    }
    if (tab === 'profile') {
      setIsProfileOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  const handleStartLesson = (words: string[]) => {
    setActiveWords(words);
  };

  const handleFinishLesson = (xpEarned: number, starsEarned: number) => {
    setStars(prev => Math.min(maxStars, prev + starsEarned));
    setActiveWords(null);
  };

  const handleClaimDailyGift = () => {
    setHearts(10);
  };

  const handleBuyHeart = () => {
    if (stars >= 5 && hearts < 10) {
      setStars(prev => prev - 5);
      setHearts(prev => Math.min(10, prev + 1));
    }
  };

  if (activeWords) {
    return (
      <LessonPracticeScreen
        words={activeWords}
        targetLang="RU"
        onComplete={handleFinishLesson}
        onExit={() => setActiveWords(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      
      {/* 1. Exact TopBar from sensei-7 */}
      <TopBar />

      {/* 2. Main Content Screens */}
      <main className="flex-1 max-w-md mx-auto w-full">
        {currentTab === 'home' && (
          <HomeScreen
            onStartLesson={handleStartLesson}
            onStartTest={() => handleStartLesson(['Привет', 'Как дела', 'Спасибо'])}
          />
        )}

        {currentTab === 'voice' && <VoiceCoachScreen />}

        {currentTab === 'lessons' && (
          <RoadmapScreen
            stars={stars}
            maxStars={maxStars}
            hearts={hearts}
            maxHearts={maxHearts}
            onBack={() => setCurrentTab('home')}
            onSelectLevel={(lvl) => handleStartLesson(['Здравствуйте', 'Доброе утро', 'Пожалуйста'])}
          />
        )}

        {currentTab === 'text' && (
          <AlphabetScreen
            onClose={() => setCurrentTab('home')}
            selectedLanguage="ru"
          />
        )}
      </main>

      {/* 3. Exact BottomNav with 6 icons */}
      <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />

      {/* 4. Mağaza / Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        hearts={hearts}
        stars={stars}
        onClaimDailyGift={handleClaimDailyGift}
        onBuyHeart={handleBuyHeart}
      />

      {/* 5. Profil & Hesap Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName="Cevdet Can"
        userEmail="ccan22937@gmail.com"
      />

    </div>
  );
}

export default App;

export interface WordData {
  ja: string;
  romaji: string;
  tr: string;
  sentenceJa: string;
  sentenceTr: string;
  distractorsTr: string[];
  distractorsJa: string[];
  fullSentenceJa?: string;
  fullSentenceRomaji?: string;
  fullSentenceTr?: string;
  translateBlocksTr?: string[];
}

export type DrillType = 'intro' | 'ja_tr' | 'tr_ja' | 'audio' | 'audio_write' | 'sentence' | 'ja_write' | 'duo_translate' | 'duo_listen' | 'duo_match';

export interface Drill {
  id: string;
  type: DrillType;
  word?: WordData;
  options?: string[]; // Multiple choice options (legacy/simple)
  optionsData?: { text: string; subText?: string }[]; // Multiple choice options with optional subtext (like romaji)
  correctAnswer?: string;
  pairs?: { ja: string, tr: string, romaji?: string }[];
}

export interface DialogueSuggestion {
  target: string;
  romaji: string;
  native: string;
  category?: string;
}

export interface LocalDialogueResponse {
  targetLanguageText: string;
  romaji: string;
  nativeExplanation: string;
  pronunciationScore?: number;
  pronunciationFeedback?: string;
  suggestedReplies?: DialogueSuggestion[];
}

export type TabType = 'home' | 'learn' | 'voice' | 'alphabet' | 'profile';

export interface UserStats {
  xp: number;
  streak: number;
  gems: number;
  hearts: number;
  completedLessons: string[];
  level: number;
  selectedLanguage: 'en' | 'de' | 'es' | 'fr' | 'ja' | 'ru';
  dailyGoal: number;
  todayMinutes: number;
}

export interface LessonUnit {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  levels: {
    id: string;
    title: string;
    type: 'drill' | 'hybrid' | 'quiz' | 'boss';
    completed: boolean;
    xp: number;
  }[];
}

export interface DrillQuestion {
  id: string;
  prompt: string;
  promptTranslation: string;
  options: string[];
  correctAnswer: string;
  audioText?: string;
  explanation: string;
  type: 'multiple-choice' | 'hybrid-sentence' | 'listening' | 'speaking';
}

import React, { useState } from 'react';
import { Mic, MicOff, Send, Volume2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { playNativeSpeech } from '../utils/translator';
import crocodileIcon from '../assets/images/baby_crocodile_head_icon_1790450277976.jpg';

export const VoiceCoachScreen: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Sensei Timsah (Rusça)',
      time: '23:03',
      text: 'Привет! Как ваши дела сегодня? Как проходит ваш день?',
      phonetic: "Privet! Kak vashi dela sevodnya? Kak prokhodit vash den'?",
      audioText: 'Привет! Как ваши дела сегодня? Как проходит ваш день?'
    }
  ]);

  const QUICK_PHRASES = [
    {
      ru: 'Спокойной ночи',
      phonetic: 'Spokoynoy nochi',
      tr: 'İyi geceler (gece • 23:03)',
      icon: '🌙'
    },
    {
      ru: 'У меня всё отлично, спасибо',
      phonetic: 'U menya vsyo otlichno, spasibo',
      tr: 'Her şey harika gidiyor, teşekkürler',
      icon: '😊'
    },
    {
      ru: 'Здравствуйте, приятно познакомиться',
      phonetic: 'Zdravstvuyte, priyatno poznakomit\'sya',
      tr: 'Merhaba, tanıştığıma memnun oldum',
      icon: '🤝'
    }
  ];

  const handleSpeak = (text: string) => {
    playNativeSpeech(text, 'RU');
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'Sen',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputText,
      phonetic: '',
      audioText: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Sensei replies in Russian
    setTimeout(() => {
      const senseiReply = {
        id: Date.now() + 1,
        sender: 'Sensei Timsah (Rusça)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Очень хорошо! Давайте продолжим практиковать русский язык.',
        phonetic: 'Ochen khorosho! Davayte prodolzhim praktikovat russkiy yazyk.',
        audioText: 'Очень хорошо! Давайте продолжим практиковать русский язык.'
      };
      setMessages(prev => [...prev, senseiReply]);
      playNativeSpeech(senseiReply.text, 'RU');
    }, 1000);
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Tarayıcınız ses tanımayı desteklemiyor.');
      return;
    }

    const rec = new SpeechRec();
    rec.lang = 'tr-TR';
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => {
      const spoken = e.results[0][0].transcript;
      setInputText(spoken);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between max-w-md mx-auto pb-24">
      
      {/* Messages Scroll Area */}
      <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto">
        
        {/* Welcome Card */}
        <div className="p-3.5 bg-white rounded-2xl border border-emerald-200/90 shadow-2xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg flex-shrink-0">
            🎙️
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900">
              Sensei Sesli Sohbete Hoş Geldin!
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
              Mikrofona basıp dilediğiniz gibi Türkçe veya Rusça sesli mesaj gönderin. Konuştuğunuz her kelime sesli mesaj olarak iletilir ve dinlenebilir.
            </p>
          </div>
        </div>

        {/* Chat Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-300">
                  <img src={crocodileIcon} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-slate-700">{msg.sender}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{msg.time}</span>
            </div>

            {/* Audio Waveform Player Simulation */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <button
                onClick={() => handleSpeak(msg.audioText)}
                className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs transition"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <div className="flex-1 flex items-center gap-1 h-5">
                {[4, 12, 18, 8, 14, 20, 10, 16, 6, 12, 19, 9, 15, 7, 13].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-300 rounded-full"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-1">
              <p className="text-sm font-black text-slate-900 leading-snack">
                {msg.text}
              </p>
              {msg.phonetic && (
                <p className="text-xs text-slate-500 italic mt-0.5">
                  {msg.phonetic}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Quick Russian Reply & Pronunciation Guide */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <button
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="w-full p-3 flex items-center justify-between text-left text-xs font-black text-slate-800 bg-slate-50/50"
          >
            <div className="flex items-center gap-1.5">
              <span>🇷🇺</span>
              <span>RUSÇA CEVAP & TELAFFUZ REHBERİ</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-0.5">
              {isGuideOpen ? 'Küçült' : 'Genişlet'}
              {isGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {isGuideOpen && (
            <div className="p-3 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Kelime veya Cümle Ara / Yaz..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                {QUICK_PHRASES.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1 text-xs font-black text-slate-900">
                        <span>{item.icon}</span>
                        <span>{item.phonetic}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.tr}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSpeak(item.ru)}
                        className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Dinle</span>
                      </button>
                      <button
                        onClick={() => setInputText(item.ru)}
                        className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                      >
                        Seç
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Message Input Bar */}
      <div className="sticky bottom-16 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-xs ${
              isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-lime-500 hover:bg-lime-600 text-white'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Sensei'ye bir soru sor veya dilediğini yaz..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

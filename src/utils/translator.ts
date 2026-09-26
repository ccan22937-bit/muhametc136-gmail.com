// Offline On-Device Translation & Vocabulary Engine for Sensei

export interface WordTranslation {
  tr: string;
  target: string;
  phonetic: string;
  exampleTr: string;
  exampleTarget: string;
}

const DICTIONARY: Record<string, Record<string, { target: string; phonetic: string; exTr: string; exTarget: string }>> = {
  // Common Turkish words translated to RU, EN, DE, ES, FR, JA
  'merhaba': {
    RU: { target: 'Привет', phonetic: 'Privet', exTr: 'Merhaba arkadaşım!', exTarget: 'Привет мой друг!' },
    EN: { target: 'Hello', phonetic: 'He-low', exTr: 'Hello my friend!', exTarget: 'Hello my friend!' },
    DE: { target: 'Hallo', phonetic: 'Ha-lo', exTr: 'Hallo mein Freund!', exTarget: 'Hallo mein Freund!' },
    ES: { target: 'Hola', phonetic: 'O-la', exTr: '¡Hola amigo!', exTarget: '¡Hola amigo!' },
    FR: { target: 'Bonjour', phonetic: 'Bon-jur', exTr: 'Bonjour mon ami!', exTarget: 'Bonjour mon ami!' },
    JA: { target: 'こんにちは', phonetic: 'Konnichiwa', exTr: 'こんにちは！', exTarget: 'こんにちは！' }
  },
  'günaydın': {
    RU: { target: 'Доброе утро', phonetic: 'Dobroye utro', exTr: 'Günaydın herkese!', exTarget: 'Доброе утро всем!' },
    EN: { target: 'Good morning', phonetic: 'Gud mor-ning', exTr: 'Good morning everyone!', exTarget: 'Good morning everyone!' },
    DE: { target: 'Guten Morgen', phonetic: 'Gu-ten Mor-gen', exTr: 'Guten Morgen!', exTarget: 'Guten Morgen!' },
    ES: { target: 'Buenos días', phonetic: 'Bwe-nos di-as', exTr: '¡Buenos días!', exTarget: '¡Buenos días!' },
    FR: { target: 'Bonjour', phonetic: 'Bon-jur', exTr: 'Bonjour tout le monde!', exTarget: 'Bonjour tout le monde!' },
    JA: { target: 'おはよう', phonetic: 'Ohayou', exTr: 'おはようございます！', exTarget: 'おはようございます！' }
  },
  'teşekkürler': {
    RU: { target: 'Спасибо', phonetic: 'Spasibo', exTr: 'Çok teşekkürler!', exTarget: 'Большое спасибо!' },
    EN: { target: 'Thank you', phonetic: 'Tenk yu', exTr: 'Thank you very much!', exTarget: 'Thank you very much!' },
    DE: { target: 'Danke', phonetic: 'Dan-ke', exTr: 'Danke schön!', exTarget: 'Danke schön!' },
    ES: { target: 'Gracias', phonetic: 'Gra-syas', exTr: '¡Muchas gracias!', exTarget: '¡Muchas gracias!' },
    FR: { target: 'Merci', phonetic: 'Mer-si', exTr: 'Merci beaucoup!', exTarget: 'Merci beaucoup!' },
    JA: { target: 'ありがとう', phonetic: 'Arigatou', exTr: 'どうもありがとう！', exTarget: 'どうもありがとう！' }
  },
  'nasılsın': {
    RU: { target: 'Как дела', phonetic: 'Kak dela', exTr: 'Nasılsın bugün?', exTarget: 'Как дела сегодня?' },
    EN: { target: 'How are you', phonetic: 'Haw ar yu', exTr: 'How are you today?', exTarget: 'How are you today?' },
    DE: { target: 'Wie geht es dir', phonetic: 'Vi geyt es dir', exTr: 'Wie geht es dir?', exTarget: 'Wie geht es dir?' },
    ES: { target: 'Cómo estás', phonetic: 'Ko-mo es-tas', exTr: '¿Cómo estás?', exTarget: '¿Cómo estás?' },
    FR: { target: 'Comment ça va', phonetic: 'Ko-man sa va', exTr: 'Comment ça va?', exTarget: 'Comment ça va?' },
    JA: { target: 'お元気ですか', phonetic: 'Ogenki desu ka', exTr: 'お元気ですか？', exTarget: 'お元気ですか？' }
  },
  'kahve': {
    RU: { target: 'Кофе', phonetic: 'Kofe', exTr: 'Bir kahve lütfen.', exTarget: 'Один кофе, пожалуйста.' },
    EN: { target: 'Coffee', phonetic: 'Kof-i', exTr: 'One coffee please.', exTarget: 'One coffee please.' },
    DE: { target: 'Kaffee', phonetic: 'Kaf-ee', exTr: 'Ein Kaffee bitte.', exTarget: 'Ein Kaffee bitte.' },
    ES: { target: 'Café', phonetic: 'Ka-fe', exTr: 'Un café por favor.', exTarget: 'Un café por favor.' },
    FR: { target: 'Café', phonetic: 'Ka-fe', exTr: 'Un café s\'il vous plaît.', exTarget: 'Un café s\'il vous plaît.' },
    JA: { target: 'コーヒー', phonetic: 'Koohii', exTr: 'コーヒーをお願いします。', exTarget: 'コーヒーをお願いします。' }
  },
  'su': {
    RU: { target: 'Вода', phonetic: 'Voda', exTr: 'Soğuk su lütfen.', exTarget: 'Холодная вода, пожалуйста.' },
    EN: { target: 'Water', phonetic: 'Wa-ter', exTr: 'Cold water please.', exTarget: 'Cold water please.' },
    DE: { target: 'Wasser', phonetic: 'Vas-ser', exTr: 'Kaltes Wasser bitte.', exTarget: 'Kaltes Wasser bitte.' },
    ES: { target: 'Agua', phonetic: 'A-gwa', exTr: 'Agua fría por favor.', exTarget: 'Agua fría por favor.' },
    FR: { target: 'Eau', phonetic: 'O', exTr: 'De l\'eau fraîche s\'il vous plaît.', exTarget: 'De l\'eau fraîche s\'il vous plaît.' },
    JA: { target: '水', phonetic: 'Mizu', exTr: '冷たい水をお願いします。', exTarget: '冷たい水をお願いします。' }
  },
  'elma': {
    RU: { target: 'Яблоко', phonetic: 'Yabloko', exTr: 'Kırmızı elma lezzetli.', exTarget: 'Красное яблоко вкусное.' },
    EN: { target: 'Apple', phonetic: 'Ep-ıl', exTr: 'Red apple is delicious.', exTarget: 'Red apple is delicious.' },
    DE: { target: 'Apfel', phonetic: 'Ap-fel', exTr: 'Der rote Apfel ist lecker.', exTarget: 'Der rote Apfel ist lecker.' },
    ES: { target: 'Manzana', phonetic: 'Man-sa-na', exTr: 'La manzana roja es rica.', exTarget: 'La manzana roja es rica.' },
    FR: { target: 'Pomme', phonetic: 'Pom', exTr: 'La pomme rouge est bonne.', exTarget: 'La pomme rouge est bonne.' },
    JA: { target: 'りんご', phonetic: 'Ringo', exTr: '赤いは美味しいです。', exTarget: '赤いは美味しいです。' }
  },
  'arkadaş': {
    RU: { target: 'Друг', phonetic: 'Drug', exTr: 'O benim en iyi arkadaşım.', exTarget: 'Он мой лучший друг.' },
    EN: { target: 'Friend', phonetic: 'Frend', exTr: 'He is my best friend.', exTarget: 'He is my best friend.' },
    DE: { target: 'Freund', phonetic: 'Froynd', exTr: 'Er ist mein bester Freund.', exTarget: 'Er ist mein bester Freund.' },
    ES: { target: 'Amigo', phonetic: 'A-mi-go', exTr: 'Él es mi mejor amigo.', exTarget: 'Él es mi mejor amigo.' },
    FR: { target: 'Ami', phonetic: 'A-mi', exTr: 'Il est mon meilleur ami.', exTarget: 'Il est mon meilleur ami.' },
    JA: { target: '友達', phonetic: 'Tomodachi', exTr: '彼は私の親友です。', exTarget: '彼は私の親友です。' }
  },
  'evet': {
    RU: { target: 'Да', phonetic: 'Da', exTr: 'Evet, anlıyorum.', exTarget: 'Да, я понимаю.' },
    EN: { target: 'Yes', phonetic: 'Yes', exTr: 'Yes, I understand.', exTarget: 'Yes, I understand.' },
    DE: { target: 'Ja', phonetic: 'Ya', exTr: 'Ja, ich verstehe.', exTarget: 'Ja, ich verstehe.' },
    ES: { target: 'Sí', phonetic: 'Si', exTr: 'Sí, entiendo.', exTarget: 'Sí, entiendo.' },
    FR: { target: 'Oui', phonetic: 'Vi', exTr: 'Oui, je comprends.', exTarget: 'Oui, je comprends.' },
    JA: { target: 'はい', phonetic: 'Hai', exTr: 'はい、分かります。', exTarget: 'はい、分かります。' }
  },
  'hayır': {
    RU: { target: 'Нет', phonetic: 'Nyet', exTr: 'Hayır, teşekkürler.', exTarget: 'Нет, спасибо.' },
    EN: { target: 'No', phonetic: 'No', exTr: 'No, thank you.', exTarget: 'No, thank you.' },
    DE: { target: 'Nein', phonetic: 'Nayn', exTr: 'Nein, danke.', exTarget: 'Nein, danke.' },
    ES: { target: 'No', phonetic: 'No', exTr: 'No, gracias.', exTarget: 'No, gracias.' },
    FR: { target: 'Non', phonetic: 'Non', exTr: 'Non, merci.', exTarget: 'Non, merci.' },
    JA: { target: 'いいえ', phonetic: 'Iie', exTr: 'いいえ、結構です。', exTarget: 'いいえ、結構です。' }
  }
};

export function translateWord(trWord: string, targetLang: 'RU' | 'EN' | 'DE' | 'ES' | 'FR' | 'JA'): WordTranslation {
  const clean = trWord.trim().toLowerCase();
  
  if (DICTIONARY[clean] && DICTIONARY[clean][targetLang]) {
    const data = DICTIONARY[clean][targetLang];
    return {
      tr: trWord.trim(),
      target: data.target,
      phonetic: data.phonetic,
      exampleTr: data.exTr,
      exampleTarget: data.exTarget
    };
  }

  // Smart fallback translation generator
  return {
    tr: trWord.trim(),
    target: `${trWord.trim()} (${targetLang})`,
    phonetic: trWord.trim(),
    exampleTr: `${trWord.trim()} günlük kullanım örneği.`,
    exampleTarget: `${trWord.trim()} in ${targetLang} context.`
  };
}

export function playNativeSpeech(text: string, langCode: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  switch (langCode) {
    case 'RU': utterance.lang = 'ru-RU'; break;
    case 'EN': utterance.lang = 'en-US'; break;
    case 'DE': utterance.lang = 'de-DE'; break;
    case 'ES': utterance.lang = 'es-ES'; break;
    case 'FR': utterance.lang = 'fr-FR'; break;
    case 'JA': utterance.lang = 'ja-JP'; break;
    case 'TR':
    case 'TÜ': utterance.lang = 'tr-TR'; break;
    default: utterance.lang = 'en-US';
  }

  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

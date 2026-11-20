// Google ML Kit Translation Service
// Client-side TypeScript interface for Android On-Device Google ML Kit Translation
// Uses locally cached 25-30MB language packs for zero-quota, unlimited, offline translations.

declare global {
  interface Window {
    MLKitTranslate?: {
      isAvailable: () => boolean;
      getLibraryInfo: () => string;
      getAvailableLanguages: () => string;
      translate: (text: string, sourceLang: string, targetLang: string, callbackId: string) => void;
      downloadModel: (langCode: string, requireWifi: boolean, callbackId: string) => void;
      deleteModel: (langCode: string, callbackId: string) => void;
      isModelDownloaded: (langCode: string, callbackId: string) => void;
      getDownloadedModels: (callbackId: string) => void;
    };
    SenseiTranslate?: Window['MLKitTranslate'];
    __mlkit_translate_callbacks?: Record<string, {
      onSuccess: (data: any) => void;
      onError: (err: any) => void;
    }>;
  }
}

export interface MLKitLibraryInfo {
  name: string;
  artifact: string;
  version: string;
  status: string;
  type: string;
  modelPackageApproxMb: number;
  description: string;
}

export interface MLKitLanguageItem {
  code: string;
  nameTr: string;
  nameEn: string;
  sizeMb: number;
}

/**
 * Checks if native Google ML Kit Translation is available in the current Android runtime
 */
export function isMLKitAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const bridge = window.MLKitTranslate || window.SenseiTranslate;
  if (!bridge) return false;
  try {
    return Boolean(bridge.isAvailable && bridge.isAvailable());
  } catch {
    return false;
  }
}

/**
 * Returns metadata about the packaged Google ML Kit Translation library
 */
export function getMLKitLibraryInfo(): MLKitLibraryInfo | null {
  if (!isMLKitAvailable()) return null;
  const bridge = window.MLKitTranslate || window.SenseiTranslate;
  try {
    const raw = bridge?.getLibraryInfo();
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Lists all languages supported by ML Kit with their model package sizes (~30MB)
 */
export function getMLKitAvailableLanguages(): MLKitLanguageItem[] {
  if (isMLKitAvailable()) {
    try {
      const bridge = window.MLKitTranslate || window.SenseiTranslate;
      const raw = bridge?.getAvailableLanguages();
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed parsing ML Kit languages:', e);
    }
  }

  // Fallback static list
  return [
    { code: 'tr', nameTr: 'Türkçe', nameEn: 'Turkish', sizeMb: 30 },
    { code: 'ja', nameTr: 'Japonca', nameEn: 'Japanese', sizeMb: 30 },
    { code: 'en', nameTr: 'İngilizce', nameEn: 'English', sizeMb: 30 },
    { code: 'de', nameTr: 'Almanca', nameEn: 'German', sizeMb: 30 },
    { code: 'es', nameTr: 'İspanyolca', nameEn: 'Spanish', sizeMb: 30 },
    { code: 'fr', nameTr: 'Fransızca', nameEn: 'French', sizeMb: 30 },
    { code: 'it', nameTr: 'İtalyanca', nameEn: 'Italian', sizeMb: 30 },
    { code: 'ko', nameTr: 'Korece', nameEn: 'Korean', sizeMb: 30 },
    { code: 'ru', nameTr: 'Rusça', nameEn: 'Russian', sizeMb: 30 },
    { code: 'ar', nameTr: 'Arapça', nameEn: 'Arabic', sizeMb: 30 },
    { code: 'zh', nameTr: 'Çince', nameEn: 'Chinese', sizeMb: 30 }
  ];
}

/**
 * Translates text on-device using Google ML Kit Translation
 */
export function translateWithMLKit(
  text: string,
  sourceLang: string = 'tr',
  targetLang: string = 'ja'
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isMLKitAvailable()) {
      return reject(new Error('Google ML Kit Translation Android köprüsü mevcut değil'));
    }

    const bridge = (window.MLKitTranslate || window.SenseiTranslate)!;
    const callbackId = `mlkit_t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!window.__mlkit_translate_callbacks) {
      window.__mlkit_translate_callbacks = {};
    }

    const timeoutTimer = setTimeout(() => {
      delete window.__mlkit_translate_callbacks?.[callbackId];
      reject(new Error('ML Kit çeviri işlemi zaman aşımına uğradı'));
    }, 25000);

    window.__mlkit_translate_callbacks[callbackId] = {
      onSuccess: (result: string) => {
        clearTimeout(timeoutTimer);
        delete window.__mlkit_translate_callbacks?.[callbackId];
        resolve(result);
      },
      onError: (err: any) => {
        clearTimeout(timeoutTimer);
        delete window.__mlkit_translate_callbacks?.[callbackId];
        reject(new Error(typeof err === 'string' ? err : 'ML Kit çeviri başarısız'));
      }
    };

    try {
      bridge.translate(text, sourceLang, targetLang, callbackId);
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      delete window.__mlkit_translate_callbacks?.[callbackId];
      reject(err);
    }
  });
}

/**
 * Checks if a specific language model is downloaded on device
 */
export function isMLKitModelDownloaded(langCode: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isMLKitAvailable()) {
      return resolve(false);
    }

    const bridge = (window.MLKitTranslate || window.SenseiTranslate)!;
    const callbackId = `mlkit_isdl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!window.__mlkit_translate_callbacks) {
      window.__mlkit_translate_callbacks = {};
    }

    const timer = setTimeout(() => {
      delete window.__mlkit_translate_callbacks?.[callbackId];
      resolve(false);
    }, 6000);

    window.__mlkit_translate_callbacks[callbackId] = {
      onSuccess: (isDownloaded: boolean) => {
        clearTimeout(timer);
        delete window.__mlkit_translate_callbacks?.[callbackId];
        resolve(Boolean(isDownloaded));
      },
      onError: () => {
        clearTimeout(timer);
        delete window.__mlkit_translate_callbacks?.[callbackId];
        resolve(false);
      }
    };

    try {
      bridge.isModelDownloaded(langCode, callbackId);
    } catch {
      clearTimeout(timer);
      delete window.__mlkit_translate_callbacks?.[callbackId];
      resolve(false);
    }
  });
}

/**
 * Downloads a 25-30MB language model for offline use
 */
export function downloadMLKitModel(langCode: string, requireWifi: boolean = false): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!isMLKitAvailable()) {
      return reject(new Error('Google ML Kit Translation Android köprüsü bulunamadı'));
    }

    const bridge = (window.MLKitTranslate || window.SenseiTranslate)!;
    const callbackId = `mlkit_dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!window.__mlkit_translate_callbacks) {
      window.__mlkit_translate_callbacks = {};
    }

    const timer = setTimeout(() => {
      delete window.__mlkit_translate_callbacks?.[callbackId];
      reject(new Error('Model indirme işlemi zaman aşımına uğradı'));
    }, 180000); // 3 minutes timeout for 30MB download

    window.__mlkit_translate_callbacks[callbackId] = {
      onSuccess: () => {
        clearTimeout(timer);
        delete window.__mlkit_translate_callbacks?.[callbackId];
        resolve(true);
      },
      onError: (err: any) => {
        clearTimeout(timer);
        delete window.__mlkit_translate_callbacks?.[callbackId];
        reject(new Error(typeof err === 'string' ? err : 'Model indirme hatası'));
      }
    };

    try {
      bridge.downloadModel(langCode, requireWifi, callbackId);
    } catch (err) {
      clearTimeout(timer);
      delete window.__mlkit_translate_callbacks?.[callbackId];
      reject(err);
    }
  });
}

/**
 * Deletes a downloaded language model to free up ~30MB
 */
export function deleteMLKitModel(langCode: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!isMLKitAvailable()) {
      return reject(new Error('Google ML Kit Translation Android köprüsü bulunamadı'));
    }

    const bridge = (window.MLKitTranslate || window.SenseiTranslate)!;
    const callbackId = `mlkit_del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!window.__mlkit_translate_callbacks) {
      window.__mlkit_translate_callbacks = {};
    }

    window.__mlkit_translate_callbacks[callbackId] = {
      onSuccess: () => {
        delete window.__mlkit_translate_callbacks?.[callbackId];
        resolve(true);
      },
      onError: (err: any) => {
        delete window.__mlkit_translate_callbacks?.[callbackId];
        reject(new Error(typeof err === 'string' ? err : 'Model silinemedi'));
      }
    };

    try {
      bridge.deleteModel(langCode, callbackId);
    } catch (err) {
      delete window.__mlkit_translate_callbacks?.[callbackId];
      reject(err);
    }
  });
}

/**
 * Retrieves the list of all currently downloaded model language codes
 */
export function getMLKitDownloadedModels(): Promise<string[]> {
  return new Promise((resolve) => {
    if (!isMLKitAvailable()) {
      return resolve([]);
    }

    const bridge = (window.MLKitTranslate || window.SenseiTranslate)!;
    const callbackId = `mlkit_list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!window.__mlkit_translate_callbacks) {
      window.__mlkit_translate_callbacks = {};
    }

    const timer = setTimeout(() => {
      delete window.__mlkit_translate_callbacks?.[callbackId];
      resolve([]);
    }, 6000);

    window.__mlkit_translate_callbacks[callbackId] = {
      onSuccess: (models: string[]) => {
        clearTimeout(timer);
        delete window.__mlkit_translate_callbacks?.[callbackId];
        resolve(Array.isArray(models) ? models : []);
      },
      onError: () => {
        clearTimeout(timer);
        delete window.__mlkit_translate_callbacks?.[callbackId];
        resolve([]);
      }
    };

    try {
      bridge.getDownloadedModels(callbackId);
    } catch {
      clearTimeout(timer);
      delete window.__mlkit_translate_callbacks?.[callbackId];
      resolve([]);
    }
  });
}

/**
 * Silently prepares and ensures on-device language models are ready in the background
 * without prompting or showing any UI to the user.
 */
export function prepareLanguagePair(sourceLang: string = 'tr', targetLang: string = 'ja'): void {
  if (!isMLKitAvailable()) return;
  try {
    downloadMLKitModel(targetLang, false).catch(() => {});
    downloadMLKitModel(sourceLang, false).catch(() => {});
  } catch {}
}


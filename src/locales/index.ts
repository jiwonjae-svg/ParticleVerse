import { en, TranslationKey } from './en';
import { ko } from './ko';

export type Language = 'en' | 'ko';

const translations: Record<Language, typeof en> = {
  en,
  ko,
};

// Current language state (default: English)
let currentLanguage: Language = 'en';

// Load saved language setting from browser
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('particle-verse-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.uiSettings?.language) {
        currentLanguage = parsed.state.uiSettings.language as Language;
      }
    }
  } catch (e) {
    // Use default if localStorage access fails
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getTranslation(lang: Language, key: string): string {
  const typedKey = key as TranslationKey;
  return translations[lang]?.[typedKey] || translations.en[typedKey] || key;
}

// Single argument version (uses current language)
export function t(key: string, params?: Record<string, string | number>): string {
  let text = getTranslation(currentLanguage, key);
  
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, String(value));
    });
  }
  
  return text;
}

// Language-specific version
export function tWithLang(lang: Language, key: string, params?: Record<string, string | number>): string {
  let text = getTranslation(lang, key);
  
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, String(value));
    });
  }
  
  return text;
}

export { en, ko };
export type { TranslationKey };

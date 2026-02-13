'use client';

import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { t, setLanguage, getLanguage, type Language } from '@/locales';
import { encodeSettingsToURL, exportSettingsAsJSON, importSettingsFromJSON } from '@/utils/stateSharing';
import { 
  Globe,
  Check,
  Share2,
  Copy,
  Download,
  Upload,
} from 'lucide-react';

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

export default function SettingsPanel() {
  const { uiSettings, updateUISettings } = useAppStore();
  const currentLang = getLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    updateUISettings({ language: lang });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="space-y-6"
    >
      {/* Language selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t('language')}
        </h3>
        
        <div className="space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full p-3 rounded-lg border transition-all ${
                currentLang === lang.code
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 bg-dark-700 hover:border-dark-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {lang.code === 'en' ? '🇺🇸' : '🇰🇷'}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {lang.name}
                    </p>
                  </div>
                </div>
                {currentLang === lang.code && (
                  <Check className="w-5 h-5 text-primary-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* App info */}
      <div className="pt-4 border-t border-dark-600">
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>ParticleVerse v1.1.0</p>
          <p>{t('createdWith')}</p>
        </div>
      </div>

      {/* State Sharing */}
      <div className="space-y-3 pt-4 border-t border-dark-600">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          {t('shareSettings')}
        </h3>

        <button
          onClick={() => {
            const url = encodeSettingsToURL();
            navigator.clipboard.writeText(url);
          }}
          className="w-full btn flex items-center justify-center gap-2 bg-dark-700 hover:bg-dark-600"
        >
          <Copy className="w-4 h-4" />
          {t('copyURL')}
        </button>

        <button
          onClick={() => {
            const json = exportSettingsAsJSON();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'particleverse-settings.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full btn flex items-center justify-center gap-2 bg-dark-700 hover:bg-dark-600"
        >
          <Download className="w-4 h-4" />
          {t('exportJSON')}
        </button>

        <label className="w-full btn flex items-center justify-center gap-2 bg-dark-700 hover:bg-dark-600 cursor-pointer">
          <Upload className="w-4 h-4" />
          {t('importJSON')}
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  importSettingsFromJSON(reader.result);
                }
              };
              reader.readAsText(file);
            }}
          />
        </label>
      </div>
    </motion.div>
  );
}

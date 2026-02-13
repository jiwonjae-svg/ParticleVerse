'use client';

import { useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Music, Mic, FileAudio, Activity, Volume2, Zap } from 'lucide-react';
import { t } from '@/locales';

export default function AudioPanel() {
  const {
    audioSettings,
    updateAudioSettings,
    audioData,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous URL to prevent memory leaks
    if (audioSettings.audioUrl) {
      URL.revokeObjectURL(audioSettings.audioUrl);
    }

    const url = URL.createObjectURL(file);
    updateAudioSettings({ source: 'file', audioUrl: url });
  }, [audioSettings.audioUrl, updateAudioSettings]);

  return (
    <div className="space-y-6">
      {/* Audio toggle */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-primary-400" />
            <label className="text-sm font-medium text-dark-300">{t('audioReactive')}</label>
          </div>
          <button
            onClick={() => updateAudioSettings({ enabled: !audioSettings.enabled })}
            className={`toggle ${audioSettings.enabled ? 'active' : ''}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
        <p className="text-xs text-dark-500">{t('audioReactiveDesc')}</p>
      </div>

      {audioSettings.enabled && (
        <>
          {/* Source selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-dark-300">{t('audioSource')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateAudioSettings({ source: 'microphone' })}
                className={`card flex flex-col items-center gap-2 p-3 ${
                  audioSettings.source === 'microphone' ? 'ring-2 ring-primary-500 bg-primary-500/10' : ''
                }`}
              >
                <Mic className={`w-5 h-5 ${audioSettings.source === 'microphone' ? 'text-primary-400' : 'text-dark-400'}`} />
                <span className="text-xs">{t('microphone')}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`card flex flex-col items-center gap-2 p-3 ${
                  audioSettings.source === 'file' ? 'ring-2 ring-primary-500 bg-primary-500/10' : ''
                }`}
              >
                <FileAudio className={`w-5 h-5 ${audioSettings.source === 'file' ? 'text-primary-400' : 'text-dark-400'}`} />
                <span className="text-xs">{t('audioFile')}</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Live audio levels */}
          <div className="card bg-dark-800/50 p-4 space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {t('audioLevels')}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400 w-12">{t('bass')}</span>
                <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-75"
                    style={{ width: `${(audioData?.bass || 0) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400 w-12">{t('mid')}</span>
                <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-75"
                    style={{ width: `${(audioData?.mid || 0) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400 w-12">{t('treble')}</span>
                <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-75"
                    style={{ width: `${(audioData?.treble || 0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reactivity */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {t('reactivity')}
              </label>
              <span className="text-sm text-primary-400">{Math.round(audioSettings.reactivity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={audioSettings.reactivity}
              onChange={(e) => updateAudioSettings({ reactivity: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          {/* Bass multiplier */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                {t('bassMultiplier')}
              </label>
              <span className="text-sm text-primary-400">{audioSettings.bassMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={audioSettings.bassMultiplier}
              onChange={(e) => updateAudioSettings({ bassMultiplier: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          {/* Treble multiplier */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                {t('trebleMultiplier')}
              </label>
              <span className="text-sm text-primary-400">{audioSettings.trebleMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={audioSettings.trebleMultiplier}
              onChange={(e) => updateAudioSettings({ trebleMultiplier: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          {/* Smoothing */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-300">{t('smoothing')}</label>
              <span className="text-sm text-primary-400">{Math.round(audioSettings.smoothing * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.99"
              step="0.01"
              value={audioSettings.smoothing}
              onChange={(e) => updateAudioSettings({ smoothing: parseFloat(e.target.value) })}
              className="slider"
            />
            <div className="flex justify-between text-xs text-dark-500">
              <span>{t('responsive')}</span>
              <span>{t('smooth')}</span>
            </div>
          </div>
        </>
      )}

      {/* Disabled info */}
      {!audioSettings.enabled && (
        <div className="card bg-dark-800/30 p-6 text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-dark-500" />
          <p className="text-sm text-dark-400">{t('audioDisabledDesc')}</p>
          <button
            onClick={() => updateAudioSettings({ enabled: true })}
            className="btn btn-primary mt-4"
          >
            {t('enableAudio')}
          </button>
        </div>
      )}
    </div>
  );
}

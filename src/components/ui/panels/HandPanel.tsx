'use client';

import { useAppStore } from '@/store/useAppStore';
import { Hand, Eye, Zap, Target, MoveHorizontal, Sparkles } from 'lucide-react';
import { t } from '@/locales';

export default function HandPanel() {
  const { 
    handSettings, 
    updateHandSettings,
    currentGesture,
    leftHand,
    rightHand,
  } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Hand tracking toggle */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Hand className="w-4 h-4 text-primary-400" />
            <label className="text-sm font-medium text-dark-300">{t('handTracking')}</label>
          </div>
          <button
            onClick={() => updateHandSettings({ enabled: !handSettings.enabled })}
            className={`toggle ${handSettings.enabled ? 'active' : ''}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
        <p className="text-xs text-dark-500">
          {t('handTrackingDesc')}
        </p>
      </div>

      {handSettings.enabled && (
        <>
          {/* Current status */}
          <div className="card bg-dark-800/50 p-4 space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {t('currentStatus')}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-dark-400">{t('leftHand')}</span>
                <div className={`font-medium ${leftHand ? 'text-primary-400' : 'text-dark-500'}`}>
                  {leftHand ? t('detected') : t('notDetected')}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-dark-400">{t('rightHand')}</span>
                <div className={`font-medium ${rightHand ? 'text-accent-400' : 'text-dark-500'}`}>
                  {rightHand ? t('detected') : t('notDetected')}
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <span className="text-dark-400">{t('currentGesture')}</span>
                <div className="font-medium text-white capitalize">
                  {currentGesture === 'none' ? t('noGesture') : currentGesture}
                </div>
              </div>
            </div>
          </div>

          {/* Sensitivity */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-300 flex items-center gap-2">
                <MoveHorizontal className="w-4 h-4" />
                {t('sensitivity')}
              </label>
              <span className="text-sm text-primary-400">{handSettings.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={handSettings.sensitivity}
              onChange={(e) => updateHandSettings({ sensitivity: parseFloat(e.target.value) })}
              className="slider"
            />
            <div className="flex justify-between text-xs text-dark-500">
              <span>{t('low')}</span>
              <span>{t('high')}</span>
            </div>
          </div>

          {/* Interaction radius */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-300 flex items-center gap-2">
                <Target className="w-4 h-4" />
                {t('interactionRadius')}
              </label>
              <span className="text-sm text-primary-400">{handSettings.interactionRadius}</span>
            </div>
            <input
              type="range"
              min="30"
              max="200"
              step="10"
              value={handSettings.interactionRadius}
              onChange={(e) => updateHandSettings({ interactionRadius: parseInt(e.target.value) })}
              className="slider"
            />
            <div className="flex justify-between text-xs text-dark-500">
              <span>{t('narrow')}</span>
              <span>{t('wide')}</span>
            </div>
          </div>

          {/* Attraction force */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t('attractionForce')}
              </label>
              <span className="text-sm text-primary-400">{Math.round(handSettings.attractionForce * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={handSettings.attractionForce}
              onChange={(e) => updateHandSettings({ attractionForce: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          {/* Repulsion force */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {t('repulsionForce')}
              </label>
              <span className="text-sm text-primary-400">{Math.round(handSettings.repulsionForce * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={handSettings.repulsionForce}
              onChange={(e) => updateHandSettings({ repulsionForce: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          {/* Gesture recognition */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-300">{t('gestureRecognition')}</label>
              <button
                onClick={() => updateHandSettings({ gestureEnabled: !handSettings.gestureEnabled })}
                className={`toggle ${handSettings.gestureEnabled ? 'active' : ''}`}
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>

          {/* Interaction guide */}
          <div className="card bg-dark-800/30 p-4 space-y-3">
            <h4 className="text-sm font-medium text-white">{t('gestureGuide')}</h4>
            <div className="space-y-2 text-xs text-dark-400">
              <p className="text-dark-300">
                {t('handPhysicsDesc')}
              </p>
              <div className="flex items-center justify-between">
                <span>{t('handPresence')}</span>
                <span className="text-primary-400">{t('scatterParticles')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('forceStrength')}</span>
                <span className="text-primary-400">{t('distanceBased')}</span>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-dark-300">{t('presets')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateHandSettings({
                  sensitivity: 1,
                  interactionRadius: 100,
                  attractionForce: 0.5,
                  repulsionForce: 0.5,
                })}
                className="btn btn-secondary text-xs"
              >
                {t('defaultPreset')}
              </button>
              <button
                onClick={() => updateHandSettings({
                  sensitivity: 1.5,
                  interactionRadius: 150,
                  attractionForce: 0.8,
                  repulsionForce: 0.3,
                })}
                className="btn btn-secondary text-xs"
              >
                {t('magnet')}
              </button>
              <button
                onClick={() => updateHandSettings({
                  sensitivity: 1.2,
                  interactionRadius: 120,
                  attractionForce: 0.3,
                  repulsionForce: 0.9,
                })}
                className="btn btn-secondary text-xs"
              >
                {t('shield')}
              </button>
              <button
                onClick={() => updateHandSettings({
                  sensitivity: 2,
                  interactionRadius: 80,
                  attractionForce: 0.6,
                  repulsionForce: 0.6,
                })}
                className="btn btn-secondary text-xs"
              >
                {t('precise')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Info when disabled */}
      {!handSettings.enabled && (
        <div className="card bg-dark-800/30 p-6 text-center">
          <Hand className="w-12 h-12 mx-auto mb-4 text-dark-500" />
          <p className="text-sm text-dark-400">
            {t('handTrackingOff')}
          </p>
          <button
            onClick={() => updateHandSettings({ enabled: true })}
            className="btn btn-primary mt-4"
          >
            {t('enableHandTracking')}
          </button>
        </div>
      )}
    </div>
  );
}

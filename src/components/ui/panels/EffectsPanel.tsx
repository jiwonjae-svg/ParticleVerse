'use client';

import { motion } from 'framer-motion';
import { useAppStore, ParticleEffect } from '@/store/useAppStore';
import { t } from '@/locales';
import { 
  Waves, 
  RotateCw, 
  Expand, 
  Shrink, 
  Wind, 
  Tornado, 
  Circle,
  ArrowDown,
  Minus,
  RefreshCw,
  CloudRain,
} from 'lucide-react';

interface EffectOption {
  id: ParticleEffect;
  labelKey: string;
  icon: React.ElementType;
  descKey: string;
}

const effects: EffectOption[] = [
  { id: 'none', labelKey: 'none', icon: Minus, descKey: 'noneDesc' },
  { id: 'wave', labelKey: 'wave', icon: Waves, descKey: 'waveDesc' },
  { id: 'spiral', labelKey: 'spiral', icon: RotateCw, descKey: 'spiralDesc' },
  { id: 'explode', labelKey: 'explode', icon: Expand, descKey: 'explodeDesc' },
  { id: 'implode', labelKey: 'implode', icon: Shrink, descKey: 'implodeDesc' },
  { id: 'noise', labelKey: 'noise', icon: Wind, descKey: 'noiseDesc' },
  { id: 'vortex', labelKey: 'vortex', icon: Tornado, descKey: 'vortexDesc' },
  { id: 'pulse', labelKey: 'pulse', icon: Circle, descKey: 'pulseDesc' },
  { id: 'flow', labelKey: 'flow', icon: ArrowDown, descKey: 'flowDesc' },
  { id: 'rotate', labelKey: 'rotate', icon: RefreshCw, descKey: 'rotateDesc' },
  { id: 'float', labelKey: 'float', icon: CloudRain, descKey: 'floatDesc' },
];

export default function EffectsPanel() {
  const { 
    currentEffect, 
    setCurrentEffect, 
    effectIntensity, 
    setEffectIntensity,
    rotationSettings,
    updateRotationSettings,
    floatSettings,
    updateFloatSettings,
  } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="space-y-6"
    >
      {/* Effect selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-dark-300">{t('selectEffect')}</label>
        <div className="grid grid-cols-3 gap-2">
          {effects.map((effect) => {
            const Icon = effect.icon;
            const isActive = currentEffect === effect.id;
            return (
              <button
                key={effect.id}
                onClick={() => setCurrentEffect(effect.id)}
                className={`card flex flex-col items-center gap-2 p-3 transition-all ${
                  isActive ? 'ring-2 ring-primary-500 bg-primary-500/10' : ''
                }`}
                title={t(effect.descKey)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-dark-400'}`} />
                <span className="text-xs">{t(effect.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Effect intensity */}
      {currentEffect !== 'none' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-dark-300">{t('effectIntensity')}</label>
            <span className="text-sm text-primary-400">{Math.round(effectIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effectIntensity}
            onChange={(e) => setEffectIntensity(parseFloat(e.target.value))}
            className="slider"
          />
          <div className="flex justify-between text-xs text-dark-500">
            <span>{t('weak')}</span>
            <span>{t('strong')}</span>
          </div>
        </div>
      )}

      {/* Rotation settings */}
      {currentEffect === 'rotate' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 p-4 bg-dark-800/30 rounded-lg"
        >
          <h4 className="text-sm font-medium text-white">{t('rotate')} {t('settings')}</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-dark-400">{t('rotationSpeed')}</label>
              <span className="text-sm text-white">{rotationSettings.speed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={rotationSettings.speed}
              onChange={(e) => updateRotationSettings({ speed: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          <div className="flex gap-2">
            {(['axisX', 'axisY', 'axisZ'] as const).map((axis) => (
              <button
                key={axis}
                onClick={() => updateRotationSettings({ [axis]: !rotationSettings[axis] })}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                  rotationSettings[axis]
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
              >
                {t(`rotation${axis.charAt(0).toUpperCase() + axis.slice(1)}`)}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Float settings */}
      {currentEffect === 'float' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 p-4 bg-dark-800/30 rounded-lg"
        >
          <h4 className="text-sm font-medium text-white">{t('float')} {t('settings')}</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-dark-400">{t('floatSpeed')}</label>
              <span className="text-sm text-white">{floatSettings.speed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={floatSettings.speed}
              onChange={(e) => updateFloatSettings({ speed: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-dark-400">{t('floatRange')}</label>
              <span className="text-sm text-white">{floatSettings.range}</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={floatSettings.range}
              onChange={(e) => updateFloatSettings({ range: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-dark-400">{t('floatRandomness')}</label>
              <span className="text-sm text-white">{floatSettings.randomness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={floatSettings.randomness}
              onChange={(e) => updateFloatSettings({ randomness: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>
        </motion.div>
      )}

      {/* Effect description */}
      <div className="card bg-dark-800/30 p-4">
        <h4 className="text-sm font-medium text-white mb-2">
          {t(effects.find(e => e.id === currentEffect)?.labelKey || 'none')}
        </h4>
        <p className="text-xs text-dark-400">
          {t(effects.find(e => e.id === currentEffect)?.descKey || 'noneDesc')}
        </p>
        {currentEffect !== 'none' && (
          <p className="text-xs text-dark-500 mt-2">
            {t('handGestureNote')}
          </p>
        )}
      </div>

      {/* Presets */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-dark-300">{t('quickPresets')}</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setCurrentEffect('wave');
              setEffectIntensity(0.3);
            }}
            className="btn btn-secondary text-xs"
          >
            {t('smoothWave')}
          </button>
          <button
            onClick={() => {
              setCurrentEffect('spiral');
              setEffectIntensity(0.5);
            }}
            className="btn btn-secondary text-xs"
          >
            {t('elegantSpin')}
          </button>
          <button
            onClick={() => {
              setCurrentEffect('explode');
              setEffectIntensity(0.7);
            }}
            className="btn btn-secondary text-xs"
          >
            {t('dynamicExplode')}
          </button>
          <button
            onClick={() => {
              setCurrentEffect('noise');
              setEffectIntensity(0.4);
            }}
            className="btn btn-secondary text-xs"
          >
            {t('organicNoise')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

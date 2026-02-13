'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/locales';
import { AlertTriangle } from 'lucide-react';

export default function ParticlePanel() {
  const { 
    particleSettings, 
    updateParticleSettings 
  } = useAppStore();

  const handleCountChange = (value: number) => {
    const clampedValue = Math.min(Math.max(value, 1000), 200000);
    updateParticleSettings({ count: clampedValue });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="space-y-6"
    >
      {/* Particle count */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('particleCount')}</label>
          <span className="text-sm text-primary-400">
            {(particleSettings.count / 1000).toFixed(0)}K
          </span>
        </div>
        <input
          type="range"
          min="1000"
          max="200000"
          step="1000"
          value={particleSettings.count}
          onChange={(e) => handleCountChange(parseInt(e.target.value))}
          className="slider"
        />
        <div className="flex justify-between text-xs text-dark-500">
          <span>1K</span>
          <span>100K</span>
          <span>200K</span>
        </div>
        {particleSettings.count > 100000 && (
          <div className="flex items-center gap-2 text-xs text-yellow-500">
            <AlertTriangle className="w-3 h-3" />
            <span>{t('highParticleWarning')}</span>
          </div>
        )}
      </div>

      {/* Particle size */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('particleSize')}</label>
          <span className="text-sm text-primary-400">{particleSettings.size.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.1"
          value={particleSettings.size}
          onChange={(e) => updateParticleSettings({ size: parseFloat(e.target.value) })}
          className="slider"
        />
        <div className="flex justify-between text-xs text-dark-500">
          <span>{t('small')}</span>
          <span>{t('large')}</span>
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('opacity')}</label>
          <span className="text-sm text-primary-400">{Math.round(particleSettings.opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={particleSettings.opacity}
          onChange={(e) => updateParticleSettings({ opacity: parseFloat(e.target.value) })}
          className="slider"
        />
      </div>

      {/* Speed */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('animationSpeed')}</label>
          <span className="text-sm text-primary-400">{particleSettings.speed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={particleSettings.speed}
          onChange={(e) => updateParticleSettings({ speed: parseFloat(e.target.value) })}
          className="slider"
        />
        <div className="flex justify-between text-xs text-dark-500">
          <span>{t('stopped')}</span>
          <span>{t('fast')}</span>
        </div>
      </div>

      {/* Turbulence */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('turbulence')}</label>
          <span className="text-sm text-primary-400">{Math.round(particleSettings.turbulence * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={particleSettings.turbulence}
          onChange={(e) => updateParticleSettings({ turbulence: parseFloat(e.target.value) })}
          className="slider"
        />
        <div className="flex justify-between text-xs text-dark-500">
          <span>{t('stable')}</span>
          <span>{t('chaotic')}</span>
        </div>
      </div>

      {/* Transition speed */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('transitionSpeed')}</label>
          <span className="text-sm text-primary-400">{particleSettings.transitionSpeed.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={particleSettings.transitionSpeed}
          onChange={(e) => updateParticleSettings({ transitionSpeed: parseFloat(e.target.value) })}
          className="slider"
        />
        <div className="flex justify-between text-xs text-dark-500">
          <span>{t('slow')}</span>
          <span>{t('fast')}</span>
        </div>
        <p className="text-xs text-dark-500">{t('transitionSpeedDesc')}</p>
      </div>

      {/* Connection lines */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('particleConnection')}</label>
          <button
            onClick={() => updateParticleSettings({ showConnections: !particleSettings.showConnections })}
            className={`toggle ${particleSettings.showConnections ? 'active' : ''}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
        {particleSettings.showConnections && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-dark-400">{t('connectionDistance')}</label>
              <span className="text-xs text-primary-400">{particleSettings.connectionDistance}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={particleSettings.connectionDistance}
              onChange={(e) => updateParticleSettings({ connectionDistance: parseInt(e.target.value) })}
              className="slider"
            />
            <p className="text-xs text-yellow-500">
              {t('connectionWarning')}
            </p>
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-dark-300">{t('presets')}</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateParticleSettings({
              count: 30000,
              size: 2,
              opacity: 0.8,
              speed: 1,
              turbulence: 0.3,
            })}
            className="btn btn-secondary text-xs"
          >
            {t('standard')}
          </button>
          <button
            onClick={() => updateParticleSettings({
              count: 100000,
              size: 1,
              opacity: 0.6,
              speed: 0.5,
              turbulence: 0.2,
            })}
            className="btn btn-secondary text-xs"
          >
            {t('highDensity')}
          </button>
          <button
            onClick={() => updateParticleSettings({
              count: 20000,
              size: 4,
              opacity: 0.9,
              speed: 1.5,
              turbulence: 0.5,
            })}
            className="btn btn-secondary text-xs"
          >
            {t('dynamic')}
          </button>
          <button
            onClick={() => updateParticleSettings({
              count: 10000,
              size: 3,
              opacity: 1,
              speed: 0.3,
              turbulence: 0.1,
            })}
            className="btn btn-secondary text-xs"
          >
            {t('minimal')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

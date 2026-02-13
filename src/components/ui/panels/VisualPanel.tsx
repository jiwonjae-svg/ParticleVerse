'use client';

import { motion } from 'framer-motion';
import { useAppStore, ColorMode, type LightingMode } from '@/store/useAppStore';
import { t } from '@/locales';
import { Palette, Sun, Moon, Thermometer, Rainbow, Lightbulb, Move, Expand, Shrink, CircleDot, Waves } from 'lucide-react';

interface ColorModeOption {
  id: ColorMode;
  labelKey: string;
  icon: React.ElementType;
}

interface LightingModeOption {
  id: LightingMode;
  labelKey: string;
  descKey: string;
  icon: React.ElementType;
}

const colorModes: ColorModeOption[] = [
  { id: 'original', labelKey: 'original', icon: Palette },
  { id: 'gradient', labelKey: 'gradient', icon: Sun },
  { id: 'rainbow', labelKey: 'rainbow', icon: Rainbow },
  { id: 'monochrome', labelKey: 'monochrome', icon: Moon },
  { id: 'temperature', labelKey: 'temperature', icon: Thermometer },
];

const lightingModes: LightingModeOption[] = [
  { id: 'none', labelKey: 'lightingNone', descKey: 'noneDesc', icon: Lightbulb },
  { id: 'move', labelKey: 'lightingMove', descKey: 'lightingMoveDesc', icon: Move },
  { id: 'expand', labelKey: 'lightingExpand', descKey: 'lightingExpandDesc', icon: Expand },
  { id: 'contract', labelKey: 'lightingContract', descKey: 'lightingContractDesc', icon: Shrink },
  { id: 'pulse', labelKey: 'lightingPulse', descKey: 'lightingPulseDesc', icon: CircleDot },
  { id: 'wave', labelKey: 'lightingWave', descKey: 'lightingWaveDesc', icon: Waves },
];

export default function VisualPanel() {
  const { 
    visualSettings, 
    updateVisualSettings,
    updateLightingSettings,
  } = useAppStore();

  const { lightingSettings } = visualSettings;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="space-y-6"
    >
      {/* Color mode */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-dark-300">{t('colorMode')}</label>
        <div className="grid grid-cols-3 gap-2">
          {colorModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = visualSettings.colorMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => updateVisualSettings({ colorMode: mode.id })}
                className={`card flex flex-col items-center gap-2 p-3 transition-all ${
                  isActive ? 'ring-2 ring-primary-500 bg-primary-500/10' : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : 'text-dark-400'}`} />
                <span className="text-xs">{t(mode.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color picker (gradient/monochrome mode) */}
      {(visualSettings.colorMode === 'gradient' || visualSettings.colorMode === 'monochrome') && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-dark-300">{t('primaryColor')}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={visualSettings.primaryColor}
                onChange={(e) => updateVisualSettings({ primaryColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-dark-600"
              />
              <input
                type="text"
                value={visualSettings.primaryColor}
                onChange={(e) => updateVisualSettings({ primaryColor: e.target.value })}
                className="input flex-1 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>

          {visualSettings.colorMode === 'gradient' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-300">{t('secondaryColor')}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={visualSettings.secondaryColor}
                  onChange={(e) => updateVisualSettings({ secondaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-dark-600"
                />
                <input
                  type="text"
                  value={visualSettings.secondaryColor}
                  onChange={(e) => updateVisualSettings({ secondaryColor: e.target.value })}
                  className="input flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
          )}

          {/* Color presets */}
          <div className="space-y-2">
            <label className="text-xs text-dark-400">{t('colorPresets')}</label>
            <div className="flex flex-wrap gap-2">
              {[
                { primary: '#0ea5e9', secondary: '#d946ef', nameKey: 'cyber' },
                { primary: '#10b981', secondary: '#06b6d4', nameKey: 'neon' },
                { primary: '#f59e0b', secondary: '#ef4444', nameKey: 'fire' },
                { primary: '#8b5cf6', secondary: '#ec4899', nameKey: 'purple' },
                { primary: '#ffffff', secondary: '#6b7280', nameKey: 'mono' },
              ].map((preset) => (
                <button
                  key={preset.nameKey}
                  onClick={() => updateVisualSettings({ 
                    primaryColor: preset.primary, 
                    secondaryColor: preset.secondary 
                  })}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }} 
                  />
                  <span className="text-xs">{t(preset.nameKey)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lighting mode */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-dark-300">{t('lightingMode')}</label>
        <div className="grid grid-cols-3 gap-2">
          {lightingModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = lightingSettings.mode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => updateLightingSettings({ mode: mode.id })}
                className={`card flex flex-col items-center gap-2 p-3 transition-all ${
                  isActive ? 'ring-2 ring-accent-500 bg-accent-500/10' : ''
                }`}
                title={t(mode.descKey)}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent-400' : 'text-dark-400'}`} />
                <span className="text-xs">{t(mode.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lighting settings */}
      {lightingSettings.mode !== 'none' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 p-4 bg-dark-800/30 rounded-lg"
        >
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-dark-400">{t('lightingSpeed')}</label>
              <span className="text-sm text-white">{lightingSettings.speed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={lightingSettings.speed}
              onChange={(e) => updateLightingSettings({ speed: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-dark-400">{t('lightingIntensity')}</label>
              <span className="text-sm text-white">{Math.round(lightingSettings.intensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={lightingSettings.intensity}
              onChange={(e) => updateLightingSettings({ intensity: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-dark-400">{t('lightingRadius')}</label>
              <span className="text-sm text-white">{lightingSettings.radius}</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={lightingSettings.radius}
              onChange={(e) => updateLightingSettings({ radius: parseFloat(e.target.value) })}
              className="slider"
            />
          </div>
        </motion.div>
      )}

      {/* Bloom intensity */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('bloomEffect')}</label>
          <span className="text-sm text-primary-400">{Math.round(visualSettings.bloomIntensity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={visualSettings.bloomIntensity}
          onChange={(e) => updateVisualSettings({ bloomIntensity: parseFloat(e.target.value) })}
          className="slider"
        />
        <div className="flex justify-between text-xs text-dark-500">
          <span>{t('off')}</span>
          <span>{t('strong')}</span>
        </div>
      </div>

      {/* Background opacity */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('backgroundBrightness')}</label>
          <span className="text-sm text-primary-400">{Math.round(visualSettings.backgroundOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={visualSettings.backgroundOpacity}
          onChange={(e) => updateVisualSettings({ backgroundOpacity: parseFloat(e.target.value) })}
          className="slider"
        />
        <div className="flex justify-between text-xs text-dark-500">
          <span>{t('bright')}</span>
          <span>{t('dark')}</span>
        </div>
      </div>

      {/* Show performance stats */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-dark-300">{t('showPerformance')}</label>
          <button
            onClick={() => updateVisualSettings({ showStats: !visualSettings.showStats })}
            className={`toggle ${visualSettings.showStats ? 'active' : ''}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
        <p className="text-xs text-dark-500">
          {t('performanceDesc')}
        </p>
      </div>

      {/* Visual presets */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-dark-300">{t('atmospherePresets')}</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateVisualSettings({
              colorMode: 'gradient',
              primaryColor: '#0ea5e9',
              secondaryColor: '#d946ef',
              bloomIntensity: 0.8,
              backgroundOpacity: 1,
            })}
            className="btn btn-secondary text-xs"
          >
            {t('cyberpunk')}
          </button>
          <button
            onClick={() => updateVisualSettings({
              colorMode: 'monochrome',
              primaryColor: '#ffffff',
              bloomIntensity: 0.3,
              backgroundOpacity: 1,
            })}
            className="btn btn-secondary text-xs"
          >
            {t('minimal')}
          </button>
          <button
            onClick={() => updateVisualSettings({
              colorMode: 'rainbow',
              bloomIntensity: 1.2,
              backgroundOpacity: 1,
            })}
            className="btn btn-secondary text-xs"
          >
            {t('party')}
          </button>
          <button
            onClick={() => updateVisualSettings({
              colorMode: 'temperature',
              bloomIntensity: 0.5,
              backgroundOpacity: 1,
            })}
            className="btn btn-secondary text-xs"
          >
            {t('space')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * State sharing utilities
 * Encode/decode particle settings for URL sharing and JSON export/import
 */

import { useAppStore } from '@/store/useAppStore';

// Keys to include in shared state (safe, non-sensitive settings only)
const SHAREABLE_KEYS = [
  'currentEffect',
  'effectIntensity',
  'particleSettings',
  'visualSettings',
  'rotationSettings',
  'floatSettings',
] as const;

type ShareableState = {
  currentEffect?: string;
  effectIntensity?: number;
  particleSettings?: Record<string, unknown>;
  visualSettings?: Record<string, unknown>;
  rotationSettings?: Record<string, unknown>;
  floatSettings?: Record<string, unknown>;
};

/**
 * Encode current settings to a URL-safe query string
 */
export function encodeSettingsToURL(): string {
  const state = useAppStore.getState();
  const shareData: ShareableState = {};

  shareData.currentEffect = state.currentEffect;
  shareData.effectIntensity = state.effectIntensity;
  shareData.particleSettings = { ...state.particleSettings };
  shareData.visualSettings = {
    colorMode: state.visualSettings.colorMode,
    primaryColor: state.visualSettings.primaryColor,
    secondaryColor: state.visualSettings.secondaryColor,
    bloomIntensity: state.visualSettings.bloomIntensity,
    backgroundOpacity: state.visualSettings.backgroundOpacity,
    colorTransitionSpeed: state.visualSettings.colorTransitionSpeed,
    lightingSettings: { ...state.visualSettings.lightingSettings },
  };
  shareData.rotationSettings = { ...state.rotationSettings };
  shareData.floatSettings = { ...state.floatSettings };

  const json = JSON.stringify(shareData);
  const encoded = btoa(encodeURIComponent(json));

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : '';

  return `${baseUrl}?s=${encoded}`;
}

/**
 * Decode and apply settings from URL query string
 * Returns true if settings were found and applied
 */
export function decodeSettingsFromURL(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('s');
  if (!encoded) return false;

  try {
    const json = decodeURIComponent(atob(encoded));
    const data = JSON.parse(json) as ShareableState;

    const store = useAppStore.getState();

    if (data.currentEffect && typeof data.currentEffect === 'string') {
      store.setCurrentEffect(data.currentEffect as Parameters<typeof store.setCurrentEffect>[0]);
    }
    if (typeof data.effectIntensity === 'number') {
      store.setEffectIntensity(data.effectIntensity);
    }
    if (data.particleSettings && typeof data.particleSettings === 'object') {
      store.updateParticleSettings(data.particleSettings as Record<string, number | boolean>);
    }
    if (data.visualSettings && typeof data.visualSettings === 'object') {
      const vs = data.visualSettings as Record<string, unknown>;
      const lightingSettings = vs.lightingSettings;
      delete vs.lightingSettings;
      store.updateVisualSettings(vs as Record<string, string | number | boolean>);
      if (lightingSettings && typeof lightingSettings === 'object') {
        store.updateLightingSettings(lightingSettings as Record<string, string | number>);
      }
    }
    if (data.rotationSettings && typeof data.rotationSettings === 'object') {
      store.updateRotationSettings(data.rotationSettings as Record<string, number | boolean>);
    }
    if (data.floatSettings && typeof data.floatSettings === 'object') {
      store.updateFloatSettings(data.floatSettings as Record<string, number>);
    }

    // Clean URL after applying
    window.history.replaceState({}, '', window.location.pathname);
    return true;
  } catch (e) {
    console.error('Failed to decode shared settings:', e);
    return false;
  }
}

/**
 * Export current settings as a JSON string
 */
export function exportSettingsAsJSON(): string {
  const state = useAppStore.getState();

  const exportData = {
    version: 1,
    timestamp: new Date().toISOString(),
    settings: {
      currentEffect: state.currentEffect,
      effectIntensity: state.effectIntensity,
      sourceType: state.sourceType,
      particleSettings: state.particleSettings,
      visualSettings: state.visualSettings,
      rotationSettings: state.rotationSettings,
      floatSettings: state.floatSettings,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import settings from a JSON string
 * Returns true on success
 */
export function importSettingsFromJSON(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (!data || data.version !== 1 || !data.settings) {
      console.error('Invalid settings file format');
      return false;
    }

    const store = useAppStore.getState();
    const s = data.settings;

    if (s.currentEffect) store.setCurrentEffect(s.currentEffect);
    if (typeof s.effectIntensity === 'number') store.setEffectIntensity(s.effectIntensity);
    if (s.sourceType) store.setSourceType(s.sourceType);
    if (s.particleSettings) store.updateParticleSettings(s.particleSettings);
    if (s.visualSettings) {
      const { lightingSettings, ...rest } = s.visualSettings;
      store.updateVisualSettings(rest);
      if (lightingSettings) store.updateLightingSettings(lightingSettings);
    }
    if (s.rotationSettings) store.updateRotationSettings(s.rotationSettings);
    if (s.floatSettings) store.updateFloatSettings(s.floatSettings);

    return true;
  } catch (e) {
    console.error('Failed to import settings:', e);
    return false;
  }
}

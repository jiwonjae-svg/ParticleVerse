import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Language } from '@/locales';

// Particle source type
export type ParticleSourceType = 'image' | 'cubemap' | 'text' | 'model' | 'default';

// Particle effect type
export type ParticleEffect = 
  | 'none' 
  | 'wave' 
  | 'spiral' 
  | 'explode' 
  | 'implode' 
  | 'noise' 
  | 'vortex'
  | 'pulse'
  | 'flow'
  | 'rotate'
  | 'float';

// Color mode
export type ColorMode = 'original' | 'gradient' | 'rainbow' | 'monochrome' | 'temperature';

// Lighting mode
export type LightingMode = 'none' | 'move' | 'expand' | 'contract' | 'pulse' | 'wave';

// Hand gesture
export type HandGesture = 'none' | 'open' | 'closed' | 'pinch' | 'point' | 'peace';

interface HandPosition {
  x: number;
  y: number;
  z: number;
}

interface ParticleSettings {
  count: number;
  size: number;
  opacity: number;
  speed: number;
  turbulence: number;
  connectionDistance: number;
  showConnections: boolean;
  transitionSpeed: number;
}

interface RotationSettings {
  speed: number;
  axisX: boolean;
  axisY: boolean;
  axisZ: boolean;
}

interface FloatSettings {
  speed: number;
  range: number;
  randomness: number;
}

interface LightingSettings {
  mode: LightingMode;
  speed: number;
  intensity: number;
  radius: number;
}

interface VisualSettings {
  colorMode: ColorMode;
  primaryColor: string;
  secondaryColor: string;
  bloomIntensity: number;
  backgroundOpacity: number;
  showStats: boolean;
  lightingSettings: LightingSettings;
  colorTransitionSpeed: number;
}

interface HandSettings {
  enabled: boolean;
  sensitivity: number;
  interactionRadius: number;
  attractionForce: number;
  repulsionForce: number;
  gestureEnabled: boolean;
  gestureTransitionSpeed: number;
}

interface RecordingSettings {
  format: 'webm' | 'mp4';
  quality: number;
  fps: number;
  includeAudio: boolean;
}

interface UISettings {
  language: Language;
}

interface AudioSettings {
  enabled: boolean;
  source: 'microphone' | 'file';
  reactivity: number;
  bassMultiplier: number;
  trebleMultiplier: number;
  smoothing: number;
  audioUrl: string | null;
}

export interface AudioData {
  bass: number;
  mid: number;
  treble: number;
  energy: number;
}

interface AppState {
  // Source state
  sourceType: ParticleSourceType;
  sourceData: string | string[] | null;
  isLoading: boolean;
  error: string | null;

  // Effect state
  currentEffect: ParticleEffect;
  effectIntensity: number;
  rotationSettings: RotationSettings;
  floatSettings: FloatSettings;
  
  // Transition state
  isTransitioning: boolean;
  targetEffect: ParticleEffect | null;

  // Particle settings
  particleSettings: ParticleSettings;

  // Visual settings
  visualSettings: VisualSettings;

  // Hand tracking settings
  handSettings: HandSettings;
  leftHand: HandPosition | null;
  rightHand: HandPosition | null;
  currentGesture: HandGesture;

  // UI settings
  uiSettings: UISettings;
  isPanelVisible: boolean;
  activeTab: string;

  // Recording settings
  recordingSettings: RecordingSettings;
  isRecording: boolean;

  // Audio
  audioSettings: AudioSettings;
  audioData: AudioData | null;

  // Performance monitoring
  fps: number;
  particleCount: number;

  // Actions
  setSourceType: (type: ParticleSourceType) => void;
  setSourceData: (data: string | string[] | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentEffect: (effect: ParticleEffect) => void;
  setEffectIntensity: (intensity: number) => void;
  updateParticleSettings: (settings: Partial<ParticleSettings>) => void;
  updateVisualSettings: (settings: Partial<VisualSettings>) => void;
  updateHandSettings: (settings: Partial<HandSettings>) => void;
  updateRotationSettings: (settings: Partial<RotationSettings>) => void;
  updateFloatSettings: (settings: Partial<FloatSettings>) => void;
  updateLightingSettings: (settings: Partial<LightingSettings>) => void;
  updateUISettings: (settings: Partial<UISettings>) => void;
  updateRecordingSettings: (settings: Partial<RecordingSettings>) => void;
  setHandPosition: (hand: 'left' | 'right', position: HandPosition | null) => void;
  setCurrentGesture: (gesture: HandGesture) => void;
  togglePanel: () => void;
  setActiveTab: (tab: string) => void;
  setFPS: (fps: number) => void;
  setParticleCount: (count: number) => void;
  setIsRecording: (recording: boolean) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  setAudioData: (data: AudioData) => void;
  reset: () => void;
}

const defaultRotationSettings: RotationSettings = {
  speed: 0.5,
  axisX: false,
  axisY: true,
  axisZ: false,
};

const defaultFloatSettings: FloatSettings = {
  speed: 0.5,
  range: 50,
  randomness: 0.5,
};

const defaultLightingSettings: LightingSettings = {
  mode: 'none',
  speed: 0.5,
  intensity: 0.7,
  radius: 100,
};

const defaultParticleSettings: ParticleSettings = {
  count: 50000,
  size: 2,
  opacity: 0.8,
  speed: 1,
  turbulence: 0.5,
  connectionDistance: 0,
  showConnections: false,
  transitionSpeed: 0.5,
};

const defaultVisualSettings: VisualSettings = {
  colorMode: 'original',
  primaryColor: '#0ea5e9',
  secondaryColor: '#d946ef',
  bloomIntensity: 0.5,
  backgroundOpacity: 1,
  showStats: false,
  lightingSettings: defaultLightingSettings,
  colorTransitionSpeed: 0.5,
};

const defaultHandSettings: HandSettings = {
  enabled: false,
  sensitivity: 1,
  interactionRadius: 100,
  attractionForce: 0.5,
  repulsionForce: 0.5,
  gestureEnabled: true,
  gestureTransitionSpeed: 0.5,
};

const defaultUISettings: UISettings = {
  language: 'en',
};

const defaultRecordingSettings: RecordingSettings = {
  format: 'webm',
  quality: 0.9,
  fps: 30,
  includeAudio: false,
};

const defaultAudioSettings: AudioSettings = {
  enabled: false,
  source: 'microphone',
  reactivity: 1,
  bassMultiplier: 1.5,
  trebleMultiplier: 1,
  smoothing: 0.8,
  audioUrl: null,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        sourceType: 'default',
        sourceData: null,
        isLoading: false,
        error: null,
        currentEffect: 'none',
        effectIntensity: 0.5,
        particleSettings: defaultParticleSettings,
        visualSettings: defaultVisualSettings,
        handSettings: defaultHandSettings,
        rotationSettings: defaultRotationSettings,
        floatSettings: defaultFloatSettings,
        leftHand: null,
        rightHand: null,
        currentGesture: 'none',
        isPanelVisible: true,
        activeTab: 'source',
        fps: 60,
        particleCount: 0,
        isTransitioning: false,
        targetEffect: null,
        uiSettings: defaultUISettings,
        recordingSettings: defaultRecordingSettings,
        isRecording: false,
        audioSettings: defaultAudioSettings,
        audioData: null,

        // Actions
        setSourceType: (type) => set({ sourceType: type }),
        setSourceData: (data) => set({ sourceData: data }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setCurrentEffect: (effect) => set({ currentEffect: effect }),
        setEffectIntensity: (intensity) => set({ effectIntensity: intensity }),
        
        updateParticleSettings: (settings) =>
          set((state) => ({
            particleSettings: { ...state.particleSettings, ...settings },
          })),

        updateVisualSettings: (settings) =>
          set((state) => ({
            visualSettings: { ...state.visualSettings, ...settings },
          })),

        updateHandSettings: (settings) =>
          set((state) => ({
            handSettings: { ...state.handSettings, ...settings },
          })),

        updateRotationSettings: (settings) =>
          set((state) => ({
            rotationSettings: { ...state.rotationSettings, ...settings },
          })),

        updateFloatSettings: (settings) =>
          set((state) => ({
            floatSettings: { ...state.floatSettings, ...settings },
          })),

        updateLightingSettings: (settings) =>
          set((state) => ({
            visualSettings: {
              ...state.visualSettings,
              lightingSettings: { ...state.visualSettings.lightingSettings, ...settings },
            },
          })),

        updateUISettings: (settings) =>
          set((state) => ({
            uiSettings: { ...state.uiSettings, ...settings },
          })),

        updateRecordingSettings: (settings) =>
          set((state) => ({
            recordingSettings: { ...state.recordingSettings, ...settings },
          })),

        setHandPosition: (hand, position) =>
          set(hand === 'left' ? { leftHand: position } : { rightHand: position }),

        setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
        togglePanel: () => set((state) => ({ isPanelVisible: !state.isPanelVisible })),
        setActiveTab: (tab) => set({ activeTab: tab }),
        setFPS: (fps) => set({ fps }),
        setParticleCount: (count) => set({ particleCount: count }),
        setIsRecording: (recording) => set({ isRecording: recording }),
        setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

        updateAudioSettings: (settings) =>
          set((state) => ({
            audioSettings: { ...state.audioSettings, ...settings },
          })),
        setAudioData: (data) => set({ audioData: data }),

        reset: () =>
          set({
            sourceType: 'default',
            sourceData: null,
            isLoading: false,
            error: null,
            currentEffect: 'none',
            effectIntensity: 0.5,
            particleSettings: defaultParticleSettings,
            visualSettings: defaultVisualSettings,
            handSettings: defaultHandSettings,
            rotationSettings: defaultRotationSettings,
            floatSettings: defaultFloatSettings,
            isTransitioning: false,
            targetEffect: null,
            uiSettings: defaultUISettings,
            recordingSettings: defaultRecordingSettings,
            isRecording: false,
            audioSettings: defaultAudioSettings,
            audioData: null,
          }),
      }),
      {
        name: 'particle-verse-storage',
        partialize: (state) => ({
          particleSettings: state.particleSettings,
          visualSettings: state.visualSettings,
          handSettings: state.handSettings,
          rotationSettings: state.rotationSettings,
          floatSettings: state.floatSettings,
          uiSettings: state.uiSettings,
          recordingSettings: state.recordingSettings,
          audioSettings: state.audioSettings,
        }),
      }
    )
  )
);

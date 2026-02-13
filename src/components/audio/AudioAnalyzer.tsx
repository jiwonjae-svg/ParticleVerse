'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

// Frequency band ranges (bin indices for 44100Hz, FFT size 2048)
const BASS_END = 12;     // ~260Hz
const MID_END = 186;     // ~4000Hz

export default function AudioAnalyzer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const mountedRef = useRef(true);

  const {
    audioSettings,
    setAudioData,
  } = useAppStore();

  // Analyze frequency data each frame
  const analyze = useCallback(() => {
    if (!analyserRef.current || !frequencyDataRef.current || !mountedRef.current) return;

    analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
    const data = frequencyDataRef.current;
    const binCount = data.length;

    // Compute band averages (0-255 → 0-1)
    let bassSum = 0, bassCount = 0;
    let midSum = 0, midCount = 0;
    let trebleSum = 0, trebleCount = 0;
    let totalSum = 0;

    for (let i = 0; i < binCount; i++) {
      const val = data[i];
      totalSum += val;

      if (i < BASS_END) {
        bassSum += val;
        bassCount++;
      } else if (i < MID_END) {
        midSum += val;
        midCount++;
      } else {
        trebleSum += val;
        trebleCount++;
      }
    }

    const smoothing = audioSettings.smoothing || 0.8;
    const reactivity = audioSettings.reactivity || 1;

    const rawBass = bassCount > 0 ? (bassSum / bassCount / 255) * audioSettings.bassMultiplier * reactivity : 0;
    const rawMid = midCount > 0 ? (midSum / midCount / 255) * reactivity : 0;
    const rawTreble = trebleCount > 0 ? (trebleSum / trebleCount / 255) * audioSettings.trebleMultiplier * reactivity : 0;
    const rawEnergy = binCount > 0 ? (totalSum / binCount / 255) * reactivity : 0;

    // Exponential smoothing for stability
    setAudioData({
      bass: Math.min(rawBass, 1),
      mid: Math.min(rawMid, 1),
      treble: Math.min(rawTreble, 1),
      energy: Math.min(rawEnergy, 1),
    });

    animationRef.current = requestAnimationFrame(analyze);
  }, [audioSettings, setAudioData]);

  // Initialize audio context and source
  useEffect(() => {
    if (!audioSettings.enabled) {
      // Reset audio data when disabled
      setAudioData({ bass: 0, mid: 0, treble: 0, energy: 0 });
      return;
    }

    mountedRef.current = true;

    const initAudio = async () => {
      try {
        // Create audio context
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = ctx;

        // Create analyser
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = audioSettings.smoothing || 0.8;
        analyserRef.current = analyser;

        frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

        if (audioSettings.source === 'microphone') {
          // Microphone input
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          sourceRef.current = source;
        } else if (audioSettings.source === 'file' && audioSettings.audioUrl) {
          // Audio file input
          const audio = new Audio();
          audio.crossOrigin = 'anonymous';
          audio.src = audioSettings.audioUrl;
          audio.loop = true;
          audioElementRef.current = audio;

          const source = ctx.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(ctx.destination); // Enable playback
          sourceRef.current = source;

          await audio.play();
        }

        // Start analysis loop
        animationRef.current = requestAnimationFrame(analyze);
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };

    initAudio();

    return () => {
      mountedRef.current = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setAudioData({ bass: 0, mid: 0, treble: 0, energy: 0 });
    };
  }, [audioSettings.enabled, audioSettings.source, audioSettings.audioUrl, analyze, setAudioData]);

  // No visible UI — pure audio processing
  return null;
}

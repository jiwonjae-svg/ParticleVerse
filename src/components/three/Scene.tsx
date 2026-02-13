'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import ParticleSystem from './ParticleSystem';
import { useAppStore } from '@/store/useAppStore';
import { generateParticlesFromImage, generateDefaultParticles, generateTextParticles } from '@/utils/particleGenerator';

// Check if device is mobile
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

export default function Scene() {
  const { 
    sourceType, 
    sourceData, 
    visualSettings,
    particleSettings,
    setLoading,
    setError,
    isPanelVisible,
    togglePanel
  } = useAppStore();

  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
    
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle canvas click to close panel on mobile
  const handleCanvasClick = () => {
    if (isMobile && isPanelVisible) {
      togglePanel();
    }
  };

  const [currentData, setCurrentData] = useState<{
    positions: Float32Array;
    colors: Float32Array;
  } | null>(null);

  const [targetData, setTargetData] = useState<{
    positions: Float32Array;
    colors: Float32Array;
  } | null>(null);

  const previousSourceRef = useRef<{ type: string; data: unknown } | null>(null);

  // Generate particle data
  useEffect(() => {
    const generateParticles = async () => {
      // Show spherical particles when sourceData is null or default type
      if (sourceData === null || sourceType === 'default') {
        const currentSource = { type: 'default', data: null };
        
        // Skip if same source
        if (
          previousSourceRef.current?.type === 'default' &&
          previousSourceRef.current?.data === null
        ) {
          return;
        }
        
        setLoading(true);
        const result = generateDefaultParticles(particleSettings.count);
        
        // Set up transition
        if (currentData) {
          setTargetData(result);
        } else {
          setCurrentData(result);
          setTargetData(null);
        }
        
        previousSourceRef.current = currentSource;
        setLoading(false);
        return;
      }

      // Skip if same source
      const currentSource = { type: sourceType, data: sourceData };
      if (
        previousSourceRef.current?.type === sourceType &&
        previousSourceRef.current?.data === sourceData
      ) {
        return;
      }
      
      setLoading(true);
      setError(null);

      try {
        let result: { positions: Float32Array; colors: Float32Array };

        switch (sourceType) {
          case 'image':
            if (sourceData && typeof sourceData === 'string') {
              result = await generateParticlesFromImage(sourceData, particleSettings.count);
            } else {
              result = generateDefaultParticles(particleSettings.count);
            }
            break;
          
          case 'cubemap':
            if (sourceData && Array.isArray(sourceData)) {
              result = await generateParticlesFromImage(sourceData[0], particleSettings.count);
            } else {
              result = generateDefaultParticles(particleSettings.count);
            }
            break;
          
          case 'text':
            if (sourceData && typeof sourceData === 'string') {
              result = generateTextParticles(sourceData, particleSettings.count);
            } else {
              result = generateDefaultParticles(particleSettings.count);
            }
            break;
          
          case 'model':
            result = generateDefaultParticles(particleSettings.count);
            break;
          
          default:
            result = generateDefaultParticles(particleSettings.count);
        }

// Set up transition: if current data exists, transition to target
          if (currentData) {
            // Adjust when particle count differs
          const currentCount = currentData.positions.length / 3;
          const newCount = result.positions.length / 3;
          
          if (currentCount !== newCount) {
              // Create new positions when particle count differs (appearing/disappearing particles)
            const adjustedPositions = new Float32Array(result.positions.length);
            const adjustedColors = new Float32Array(result.colors.length);
            
            for (let i = 0; i < newCount; i++) {
              const srcIdx = Math.min(i, currentCount - 1);
              if (i < currentCount) {
                // Existing particles start from their original position
                adjustedPositions[i * 3] = currentData.positions[srcIdx * 3];
                adjustedPositions[i * 3 + 1] = currentData.positions[srcIdx * 3 + 1];
                adjustedPositions[i * 3 + 2] = currentData.positions[srcIdx * 3 + 2];
                adjustedColors[i * 3] = currentData.colors[srcIdx * 3];
                adjustedColors[i * 3 + 1] = currentData.colors[srcIdx * 3 + 1];
                adjustedColors[i * 3 + 2] = currentData.colors[srcIdx * 3 + 2];
              } else {
                // New particles start from center
                adjustedPositions[i * 3] = (Math.random() - 0.5) * 10;
                adjustedPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
                adjustedPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
                adjustedColors[i * 3] = result.colors[i * 3];
                adjustedColors[i * 3 + 1] = result.colors[i * 3 + 1];
                adjustedColors[i * 3 + 2] = result.colors[i * 3 + 2];
              }
            }
            
            setCurrentData({ positions: adjustedPositions, colors: adjustedColors });
          }
          
          setTargetData(result);
        } else {
          // First load
          setCurrentData(result);
          setTargetData(null);
        }
        
        previousSourceRef.current = currentSource;
      } catch (error) {
        console.error('Particle generation failed:', error);
        setError('Failed to generate particles.');
        const fallback = generateDefaultParticles(particleSettings.count);
        setCurrentData(fallback);
        setTargetData(null);
      } finally {
        setLoading(false);
      }
    };

    generateParticles();
  }, [sourceType, sourceData, particleSettings.count, setLoading, setError]);

  // Update current data when transition completes
  useEffect(() => {
    if (targetData) {
      const timer = setTimeout(() => {
        setCurrentData(targetData);
        setTargetData(null);
      }, 2000 / particleSettings.transitionSpeed); // After transition completes
      
      return () => clearTimeout(timer);
    }
  }, [targetData, particleSettings.transitionSpeed]);

  // Background color
  const backgroundColor = useMemo(() => {
    const opacity = visualSettings.backgroundOpacity;
    return new THREE.Color(0, 0, 0).multiplyScalar(opacity);
  }, [visualSettings.backgroundOpacity]);

  if (!currentData) {
    return null;
  }

  return (
    <Canvas
      onClick={handleCanvasClick}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        alpha: false,
      }}
      dpr={isMobile ? [1, 1] : [1, 2]}
      performance={{ min: 0.5 }}
    >
      {visualSettings.showStats && <Stats />}

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <color attach="background" args={[backgroundColor.r, backgroundColor.g, backgroundColor.b]} />

      <PerspectiveCamera makeDefault position={[0, 0, 300]} fov={60} near={1} far={2000} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.5}
        minDistance={50}
        maxDistance={1000}
      />

      <ParticleSystem
        positions={currentData.positions}
        colors={currentData.colors}
        targetPositions={targetData?.positions}
        targetColors={targetData?.colors}
      />

      {visualSettings.bloomIntensity > 0 && (
        <EffectComposer>
          <Bloom
            intensity={isMobile ? Math.min(visualSettings.bloomIntensity, 0.5) : visualSettings.bloomIntensity}
            luminanceThreshold={isMobile ? 0.4 : 0.2}
            luminanceSmoothing={0.9}
            radius={isMobile ? 0.4 : 0.8}
          />
          <Vignette offset={0.3} darkness={0.5} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

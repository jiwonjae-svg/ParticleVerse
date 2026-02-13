'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three-stdlib';
import { useAppStore, ParticleEffect, ColorMode, LightingMode } from '@/store/useAppStore';
import { particleVertexShader, particleFragmentShader } from '@/shaders/particleShaders';
import { velocityComputeShader, positionComputeShader } from '@/gpgpu/computeShaders';

const effectToIndex: Record<ParticleEffect, number> = {
  none: 0,
  wave: 1,
  spiral: 2,
  explode: 3,
  implode: 4,
  noise: 5,
  vortex: 6,
  pulse: 7,
  flow: 8,
  rotate: 9,
  float: 10,
};

const colorModeToIndex: Record<ColorMode, number> = {
  original: 0,
  gradient: 1,
  rainbow: 2,
  monochrome: 3,
  temperature: 4,
};

const lightingModeToIndex: Record<LightingMode, number> = {
  none: 0,
  move: 1,
  expand: 2,
  contract: 3,
  pulse: 4,
  wave: 5,
};

interface ParticleSystemProps {
  positions: Float32Array;
  colors: Float32Array;
  targetPositions?: Float32Array;
  targetColors?: Float32Array;
}

export default function ParticleSystem({ 
  positions, 
  colors, 
  targetPositions, 
  targetColors 
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const transitionProgressRef = useRef(0);
  const floatOffsetRef = useRef(0);
  const effectTransitionRef = useRef(0);
  const previousEffectRef = useRef<ParticleEffect>('none');
  const previousEffectIntensityRef = useRef(0);
  const effectTransitionStageRef = useRef<'idle' | 'fadeOut' | 'showNone' | 'fadeIn'>('idle');
  const targetEffectRef = useRef<ParticleEffect>('none');
  
  // Color transition refs (prev/current mode with blend factor)
  const prevColorModeRef = useRef<ColorMode>('original');
  const currentColorModeRef = useRef<ColorMode>('original');
  const colorBlendRef = useRef(1); // 1 = fully showing current mode
  const smoothPrimaryColorRef = useRef(new THREE.Color('#0ea5e9'));
  const smoothSecondaryColorRef = useRef(new THREE.Color('#d946ef'));
  
  // Lighting transition refs
  const lightingTransitionRef = useRef(1); // 1 = complete
  const previousLightingModeRef = useRef<LightingMode>('none');
  const previousLightingSpeedRef = useRef(1);
  const previousLightingIntensityRef = useRef(0.5);
  const previousLightingRadiusRef = useRef(100);
  const smoothLightingSpeedRef = useRef(1);
  const smoothLightingIntensityRef = useRef(0.5);
  const smoothLightingRadiusRef = useRef(100);

  const {
    particleSettings,
    visualSettings,
    handSettings,
    rotationSettings,
    currentEffect,
    effectIntensity,
    leftHand,
    rightHand,
    currentGesture,
    setParticleCount,
    audioData,
  } = useAppStore();

  // Smooth hand position refs
  const smoothLeftHandRef = useRef(new THREE.Vector3());
  const smoothRightHandRef = useRef(new THREE.Vector3());
  
  // Smooth hand settings refs
  const smoothHandRadiusRef = useRef(100);
  const smoothAttractionForceRef = useRef(0.5);
  const smoothRepulsionForceRef = useRef(0.5);

  // GPGPU refs
  const gpuComputeRef = useRef<GPUComputationRenderer | null>(null);
  const posVarRef = useRef<any>(null);
  const velVarRef = useRef<any>(null);
  const gpuEnabledRef = useRef(false);

  // WebGL renderer for GPGPU
  const { gl } = useThree();
  
  // Smooth particle settings refs
  const smoothSizeRef = useRef(2);
  const smoothOpacityRef = useRef(0.8);
  const smoothSpeedRef = useRef(1);
  const smoothTurbulenceRef = useRef(0.5);

  // Lighting settings with defaults
  const lightingSettings = visualSettings.lightingSettings || {
    mode: 'none' as LightingMode,
    speed: 1,
    intensity: 0.5,
    radius: 100,
  };

  // Effect change detection and transition start
  useEffect(() => {
    if (currentEffect !== previousEffectRef.current && effectTransitionStageRef.current === 'idle') {
      targetEffectRef.current = currentEffect;
      effectTransitionStageRef.current = 'fadeOut';
      effectTransitionRef.current = 0;
    }
    
    if (effectIntensity !== previousEffectIntensityRef.current) {
      previousEffectIntensityRef.current = effectIntensity;
    }
  }, [currentEffect, effectIntensity]);
  
  // Color mode change detection - track previous and current for smooth blending
  useEffect(() => {
    if (visualSettings.colorMode !== currentColorModeRef.current) {
      prevColorModeRef.current = currentColorModeRef.current;
      currentColorModeRef.current = visualSettings.colorMode;
      colorBlendRef.current = 0; // Start transition from previous to current
    }
  }, [visualSettings.colorMode]);
  
  // Lighting change detection and transition start
  useEffect(() => {
    if (
      lightingSettings.mode !== previousLightingModeRef.current ||
      lightingSettings.speed !== previousLightingSpeedRef.current ||
      lightingSettings.intensity !== previousLightingIntensityRef.current ||
      lightingSettings.radius !== previousLightingRadiusRef.current
    ) {
      lightingTransitionRef.current = 0;
      previousLightingModeRef.current = lightingSettings.mode;
      previousLightingSpeedRef.current = lightingSettings.speed;
      previousLightingIntensityRef.current = lightingSettings.intensity;
      previousLightingRadiusRef.current = lightingSettings.radius;
    }
  }, [lightingSettings.mode, lightingSettings.speed, lightingSettings.intensity, lightingSettings.radius]);

  // Update particle count
  useEffect(() => {
    setParticleCount(positions.length / 3);
  }, [positions.length, setParticleCount]);

  // Create geometry with additional attributes for transitions
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = positions.length / 3;
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('originalPosition', new THREE.BufferAttribute(positions.slice(), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Target position (for transitions)
    const targets = targetPositions || positions.slice();
    geo.setAttribute('targetPosition', new THREE.BufferAttribute(targets, 3));
    
    // Target color (for transitions)
    const targetCols = targetColors || colors.slice();
    geo.setAttribute('targetColor', new THREE.BufferAttribute(targetCols, 3));
    
    // Random offsets (animation diversity)
    const randomOffsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      randomOffsets[i] = Math.random();
    }
    geo.setAttribute('randomOffset', new THREE.BufferAttribute(randomOffsets, 1));

    // GPGPU texture coordinates
    const texSize = Math.ceil(Math.sqrt(count));
    const texCoords = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      texCoords[i * 2] = (i % texSize + 0.5) / texSize;
      texCoords[i * 2 + 1] = (Math.floor(i / texSize) + 0.5) / texSize;
    }
    geo.setAttribute('texCoord', new THREE.BufferAttribute(texCoords, 2));

    // Compute bounding sphere
    geo.computeBoundingSphere();

    return geo;
  }, [positions, colors, targetPositions, targetColors]);

  // Create uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: particleSettings.size },
      uOpacity: { value: particleSettings.opacity },
      uSpeed: { value: particleSettings.speed },
      uTurbulence: { value: particleSettings.turbulence },
      uEffect: { value: effectToIndex[currentEffect] },
      uEffectIntensity: { value: effectIntensity },
      // Color mode uniforms for smooth transition
      uPrevColorMode: { value: 0 },
      uCurrColorMode: { value: 0 },
      uColorBlend: { value: 1.0 },
      uPrimaryColor: { value: new THREE.Color(visualSettings.primaryColor) },
      uSecondaryColor: { value: new THREE.Color(visualSettings.secondaryColor) },
      uLeftHand: { value: new THREE.Vector3() },
      uRightHand: { value: new THREE.Vector3() },
      uHandRadius: { value: handSettings.interactionRadius },
      uAttractionForce: { value: handSettings.attractionForce },
      uRepulsionForce: { value: handSettings.repulsionForce },
      uGesture: { value: 0 },
      // Rotation uniforms
      uRotateAxisX: { value: rotationSettings.axisX },
      uRotateAxisY: { value: rotationSettings.axisY },
      uRotateAxisZ: { value: rotationSettings.axisZ },
      uRotateSpeed: { value: rotationSettings.speed },
      // Lighting uniforms
      uLightingMode: { value: lightingModeToIndex[lightingSettings.mode] },
      uLightingSpeed: { value: lightingSettings.speed },
      uLightingIntensity: { value: lightingSettings.intensity },
      uLightingRadius: { value: lightingSettings.radius },
      uTransitionProgress: { value: 0 },
      uFloatOffset: { value: 0 },
      // GPGPU
      texturePhysics: { value: null },
      uUseGPGPU: { value: false },
      // Audio
      uAudioBass: { value: 0 },
      uAudioMid: { value: 0 },
      uAudioTreble: { value: 0 },
      uAudioEnergy: { value: 0 },
    }),
    []
  );

  // Update uniforms
  const updateUniforms = useCallback(() => {
    if (!materialRef.current) return;

    const mat = materialRef.current;
    // Particle settings - smoothly interpolated in useFrame
    mat.uniforms.uSize.value = smoothSizeRef.current;
    mat.uniforms.uOpacity.value = smoothOpacityRef.current;
    mat.uniforms.uSpeed.value = smoothSpeedRef.current;
    mat.uniforms.uTurbulence.value = smoothTurbulenceRef.current;
    
    // Color - smoothly interpolated
    mat.uniforms.uPrimaryColor.value.copy(smoothPrimaryColorRef.current);
    mat.uniforms.uSecondaryColor.value.copy(smoothSecondaryColorRef.current);
    
    // Hand settings - smoothly interpolated
    mat.uniforms.uHandRadius.value = smoothHandRadiusRef.current;
    mat.uniforms.uAttractionForce.value = smoothAttractionForceRef.current;
    mat.uniforms.uRepulsionForce.value = smoothRepulsionForceRef.current;
    mat.uniforms.uGesture.value = 0; // Gesture index no longer used for physics-based interaction
    
    // Rotation settings
    mat.uniforms.uRotateAxisX.value = rotationSettings.axisX;
    mat.uniforms.uRotateAxisY.value = rotationSettings.axisY;
    mat.uniforms.uRotateAxisZ.value = rotationSettings.axisZ;
    mat.uniforms.uRotateSpeed.value = rotationSettings.speed;
    
    // Lighting uniforms - smoothly interpolated
    mat.uniforms.uLightingMode.value = lightingModeToIndex[lightingSettings.mode];
    mat.uniforms.uLightingSpeed.value = smoothLightingSpeedRef.current;
    mat.uniforms.uLightingIntensity.value = smoothLightingIntensityRef.current;
    mat.uniforms.uLightingRadius.value = smoothLightingRadiusRef.current;

    // Hand position updates
    if (leftHand && handSettings.enabled) {
      mat.uniforms.uLeftHand.value.set(leftHand.x, leftHand.y, leftHand.z);
    } else {
      mat.uniforms.uLeftHand.value.set(0, 0, 0);
    }

    if (rightHand && handSettings.enabled) {
      mat.uniforms.uRightHand.value.set(rightHand.x, rightHand.y, rightHand.z);
    } else {
      mat.uniforms.uRightHand.value.set(0, 0, 0);
    }
  }, [
    particleSettings,
    visualSettings,
    handSettings,
    currentEffect,
    effectIntensity,
    leftHand,
    rightHand,
    currentGesture,
    lightingSettings,
    rotationSettings,
  ]);

  // Per-frame update
  useFrame((state, delta) => {
    if (materialRef.current) {
      const time = state.clock.elapsedTime;
      materialRef.current.uniforms.uTime.value = time;
      
      // Smooth hand position interpolation (lerp)
      const lerpFactor = Math.min(delta * handSettings.gestureTransitionSpeed * 5, 1);
      
      if (leftHand && handSettings.enabled) {
        const targetLeft = new THREE.Vector3(leftHand.x, leftHand.y, leftHand.z);
        smoothLeftHandRef.current.lerp(targetLeft, lerpFactor);
        materialRef.current.uniforms.uLeftHand.value.copy(smoothLeftHandRef.current);
      } else {
        smoothLeftHandRef.current.lerp(new THREE.Vector3(0, 0, 0), lerpFactor);
        materialRef.current.uniforms.uLeftHand.value.copy(smoothLeftHandRef.current);
      }

      if (rightHand && handSettings.enabled) {
        const targetRight = new THREE.Vector3(rightHand.x, rightHand.y, rightHand.z);
        smoothRightHandRef.current.lerp(targetRight, lerpFactor);
        materialRef.current.uniforms.uRightHand.value.copy(smoothRightHandRef.current);
      } else {
        smoothRightHandRef.current.lerp(new THREE.Vector3(0, 0, 0), lerpFactor);
        materialRef.current.uniforms.uRightHand.value.copy(smoothRightHandRef.current);
      }
      
      // Effect transition: fadeOut -> showNone (brief sphere view) -> fadeIn
      if (effectTransitionStageRef.current !== 'idle') {
        effectTransitionRef.current = Math.min(
          effectTransitionRef.current + delta * particleSettings.transitionSpeed * 2,
          1
        );
        
        if (effectTransitionStageRef.current === 'fadeOut') {
          // Fade out from current effect to none
          const fadeOutProgress = effectTransitionRef.current;
          materialRef.current.uniforms.uEffect.value = effectToIndex[previousEffectRef.current];
          materialRef.current.uniforms.uEffectIntensity.value = effectIntensity * (1 - fadeOutProgress);
          
          if (fadeOutProgress >= 1) {
            // Fade out complete, switch to none (sphere) state
            effectTransitionStageRef.current = 'showNone';
            effectTransitionRef.current = 0;
            previousEffectRef.current = 'none';
            materialRef.current.uniforms.uEffect.value = effectToIndex['none'];
            materialRef.current.uniforms.uEffectIntensity.value = 0;
          }
        } else if (effectTransitionStageRef.current === 'showNone') {
          // Show none (sphere) state briefly
          materialRef.current.uniforms.uEffect.value = effectToIndex['none'];
          materialRef.current.uniforms.uEffectIntensity.value = 0;
          
          if (effectTransitionRef.current >= 0.3) {
            // Shown sphere long enough, start fade in
            effectTransitionStageRef.current = 'fadeIn';
            effectTransitionRef.current = 0;
          }
        } else if (effectTransitionStageRef.current === 'fadeIn') {
          // Fade in from none to new effect
          const fadeInProgress = effectTransitionRef.current;
          materialRef.current.uniforms.uEffect.value = effectToIndex[targetEffectRef.current];
          materialRef.current.uniforms.uEffectIntensity.value = effectIntensity * fadeInProgress;
          
          if (fadeInProgress >= 1) {
            // Fade in complete
            effectTransitionStageRef.current = 'idle';
            previousEffectRef.current = targetEffectRef.current;
          }
        }
      } else {
        // No transition in progress - maintain current effect
        materialRef.current.uniforms.uEffect.value = effectToIndex[currentEffect];
        materialRef.current.uniforms.uEffectIntensity.value = effectIntensity;
      }
      
      // Color mode smooth transition (blend between previous and current mode)
      if (colorBlendRef.current < 1) {
        colorBlendRef.current = Math.min(
          colorBlendRef.current + delta * (visualSettings.colorTransitionSpeed || 0.5) * 1.5,
          1
        );
      }
      materialRef.current.uniforms.uPrevColorMode.value = colorModeToIndex[prevColorModeRef.current];
      materialRef.current.uniforms.uCurrColorMode.value = colorModeToIndex[currentColorModeRef.current];
      materialRef.current.uniforms.uColorBlend.value = colorBlendRef.current;
      
      // Smooth color interpolation
      const targetPrimary = new THREE.Color(visualSettings.primaryColor);
      const targetSecondary = new THREE.Color(visualSettings.secondaryColor);
      const colorLerpFactor = Math.min(delta * (visualSettings.colorTransitionSpeed || 0.5) * 3, 1);
      
      smoothPrimaryColorRef.current.lerp(targetPrimary, colorLerpFactor);
      smoothSecondaryColorRef.current.lerp(targetSecondary, colorLerpFactor);
      
      // Lighting transition
      if (lightingTransitionRef.current < 1) {
        lightingTransitionRef.current = Math.min(
          lightingTransitionRef.current + delta * particleSettings.transitionSpeed * 2,
          1
        );
      }
      
      // Smooth lighting interpolation
      const lightingLerpFactor = Math.min(delta * particleSettings.transitionSpeed * 3, 1);
      
      smoothLightingSpeedRef.current += (lightingSettings.speed - smoothLightingSpeedRef.current) * lightingLerpFactor;
      smoothLightingIntensityRef.current += (lightingSettings.intensity - smoothLightingIntensityRef.current) * lightingLerpFactor;
      smoothLightingRadiusRef.current += (lightingSettings.radius - smoothLightingRadiusRef.current) * lightingLerpFactor;
      
      // Smooth hand settings interpolation
      const handLerpFactor = Math.min(delta * handSettings.gestureTransitionSpeed * 3, 1);
      
      smoothHandRadiusRef.current += (handSettings.interactionRadius - smoothHandRadiusRef.current) * handLerpFactor;
      smoothAttractionForceRef.current += (handSettings.attractionForce - smoothAttractionForceRef.current) * handLerpFactor;
      smoothRepulsionForceRef.current += (handSettings.repulsionForce - smoothRepulsionForceRef.current) * handLerpFactor;
      
      // Smooth particle settings interpolation
      const particleLerpFactor = Math.min(delta * particleSettings.transitionSpeed * 3, 1);
      
      smoothSizeRef.current += (particleSettings.size - smoothSizeRef.current) * particleLerpFactor;
      smoothOpacityRef.current += (particleSettings.opacity - smoothOpacityRef.current) * particleLerpFactor;
      smoothSpeedRef.current += (particleSettings.speed - smoothSpeedRef.current) * particleLerpFactor;
      smoothTurbulenceRef.current += (particleSettings.turbulence - smoothTurbulenceRef.current) * particleLerpFactor;
      
      // Update transition progress for position/color transitions
      if (targetPositions) {
        transitionProgressRef.current = Math.min(
          transitionProgressRef.current + delta * particleSettings.transitionSpeed,
          1
        );
        materialRef.current.uniforms.uTransitionProgress.value = transitionProgressRef.current;
      }
      
      // Float effect: sine-based offset computed on CPU
      if (currentEffect === 'float') {
        floatOffsetRef.current = Math.sin(time * 0.5) * 0.5 + 0.5;
        materialRef.current.uniforms.uFloatOffset.value = floatOffsetRef.current;
      }

      // GPGPU compute pass
      if (gpuComputeRef.current && velVarRef.current && posVarRef.current && gpuEnabledRef.current) {
        const velUniforms = velVarRef.current.material.uniforms;
        velUniforms.uTime.value = time;
        velUniforms.uDeltaTime.value = Math.min(delta, 0.05);
        velUniforms.uLeftHand.value.copy(smoothLeftHandRef.current);
        velUniforms.uRightHand.value.copy(smoothRightHandRef.current);
        velUniforms.uHandRadius.value = smoothHandRadiusRef.current;
        velUniforms.uRepulsionForce.value = smoothRepulsionForceRef.current;
        velUniforms.uAttractionForce.value = smoothAttractionForceRef.current;
        velUniforms.uAudioBass.value = audioData?.bass || 0;
        velUniforms.uAudioEnergy.value = audioData?.energy || 0;

        posVarRef.current.material.uniforms.uDeltaTime.value = Math.min(delta, 0.05);

        gpuComputeRef.current.compute();

        const posTexture = gpuComputeRef.current.getCurrentRenderTarget(posVarRef.current).texture;
        materialRef.current.uniforms.texturePhysics.value = posTexture;
        materialRef.current.uniforms.uUseGPGPU.value = true;
      } else {
        materialRef.current.uniforms.uUseGPGPU.value = false;
      }

      // Audio reactive uniforms
      materialRef.current.uniforms.uAudioBass.value = audioData?.bass || 0;
      materialRef.current.uniforms.uAudioMid.value = audioData?.mid || 0;
      materialRef.current.uniforms.uAudioTreble.value = audioData?.treble || 0;
      materialRef.current.uniforms.uAudioEnergy.value = audioData?.energy || 0;
    }
    updateUniforms();
  });

  // Reset transition when targets change
  useEffect(() => {
    transitionProgressRef.current = 0;
  }, [targetPositions, targetColors]);

  // GPGPU initialization
  useEffect(() => {
    const count = positions.length / 3;
    const texSize = Math.ceil(Math.sqrt(count));

    try {
      const gpuCompute = new GPUComputationRenderer(texSize, texSize, gl);

      const dtPosition = gpuCompute.createTexture();
      const dtVelocity = gpuCompute.createTexture();
      const dtOriginal = gpuCompute.createTexture();

      // Fill original texture with base particle positions
      const origData = dtOriginal.image.data as unknown as Float32Array;
      for (let i = 0; i < count; i++) {
        const idx = i * 4;
        origData[idx] = positions[i * 3];
        origData[idx + 1] = positions[i * 3 + 1];
        origData[idx + 2] = positions[i * 3 + 2];
        origData[idx + 3] = 0;
      }

      const posVar = gpuCompute.addVariable('texturePosition', positionComputeShader, dtPosition);
      const velVar = gpuCompute.addVariable('textureVelocity', velocityComputeShader, dtVelocity);

      gpuCompute.setVariableDependencies(posVar, [posVar, velVar]);
      gpuCompute.setVariableDependencies(velVar, [posVar, velVar]);

      Object.assign(velVar.material.uniforms, {
        textureOriginal: { value: dtOriginal },
        uTime: { value: 0 },
        uDeltaTime: { value: 0.016 },
        uLeftHand: { value: new THREE.Vector3() },
        uRightHand: { value: new THREE.Vector3() },
        uHandRadius: { value: 100 },
        uRepulsionForce: { value: 0.5 },
        uAttractionForce: { value: 0.5 },
        uAudioBass: { value: 0 },
        uAudioEnergy: { value: 0 },
      });

      Object.assign(posVar.material.uniforms, {
        uDeltaTime: { value: 0.016 },
      });

      posVar.wrapS = THREE.ClampToEdgeWrapping;
      posVar.wrapT = THREE.ClampToEdgeWrapping;
      velVar.wrapS = THREE.ClampToEdgeWrapping;
      velVar.wrapT = THREE.ClampToEdgeWrapping;

      const error = gpuCompute.init();
      if (error !== null) {
        console.warn('GPGPU init failed:', error);
        gpuEnabledRef.current = false;
        return;
      }

      gpuComputeRef.current = gpuCompute;
      posVarRef.current = posVar;
      velVarRef.current = velVar;
      gpuEnabledRef.current = true;
    } catch (e) {
      console.warn('GPGPU unavailable, vertex shader fallback:', e);
      gpuEnabledRef.current = false;
    }

    return () => {
      if (gpuComputeRef.current) {
        gpuComputeRef.current.dispose();
        gpuComputeRef.current = null;
        gpuEnabledRef.current = false;
      }
    };
  }, [gl, positions]);

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}







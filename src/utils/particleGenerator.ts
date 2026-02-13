/**
 * Particle generation utility
 * Generates particle data from images, text, and 3D models
 */

// Generate default particles (spherical distribution)
export function generateDefaultParticles(count: number): {
  positions: Float32Array;
  colors: Float32Array;
} {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Spherical distribution
    const radius = Math.random() * 150;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // Gradient color
    const t = radius / 150;
    colors[i3] = 0.05 + t * 0.5; // R
    colors[i3 + 1] = 0.4 + t * 0.4; // G
    colors[i3 + 2] = 0.9; // B
  }

  return { positions, colors };
}

// Generate particles from image
export async function generateParticlesFromImage(
  imageUrl: string,
  maxParticles: number
): Promise<{ positions: Float32Array; colors: Float32Array }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context.'));
        return;
      }

      // Resize image (performance optimization)
      const maxSize = 256;
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Extract pixel data
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      // Collect valid pixels (non-transparent)
      const validPixels: { x: number; y: number; r: number; g: number; b: number }[] = [];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Check transparency and brightness
          if (a > 50) {
            validPixels.push({
              x: x - width / 2,
              y: -(y - height / 2),
              r: r / 255,
              g: g / 255,
              b: b / 255,
            });
          }
        }
      }

      // Sampling
      const particleCount = Math.min(maxParticles, validPixels.length);
      const step = Math.max(1, Math.floor(validPixels.length / particleCount));

      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const scale = 2; // Scale factor

      for (let i = 0; i < particleCount; i++) {
        const pixel = validPixels[Math.min(i * step, validPixels.length - 1)];
        const i3 = i * 3;

        // Position (slight random depth)
        positions[i3] = pixel.x * scale;
        positions[i3 + 1] = pixel.y * scale;
        positions[i3 + 2] = (Math.random() - 0.5) * 30;

        // Color
        colors[i3] = pixel.r;
        colors[i3 + 1] = pixel.g;
        colors[i3 + 2] = pixel.b;
      }

      resolve({ positions, colors });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

// Generate particles from text
export function generateTextParticles(
  text: string,
  maxParticles: number
): { positions: Float32Array; colors: Float32Array } {
  // Render text on canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return generateDefaultParticles(maxParticles);
  }

  // Set canvas size
  const fontSize = 120;
  ctx.font = `bold ${fontSize}px Arial`;
  const metrics = ctx.measureText(text);
  const textWidth = Math.min(metrics.width, 800);
  const textHeight = fontSize * 1.5;

  canvas.width = textWidth + 40;
  canvas.height = textHeight + 40;

  // Render text
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Extract pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Collect white pixels
  const validPixels: { x: number; y: number }[] = [];

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

      if (brightness > 128) {
        validPixels.push({
          x: x - canvas.width / 2,
          y: -(y - canvas.height / 2),
        });
      }
    }
  }

  // Sampling
  const particleCount = Math.min(maxParticles, validPixels.length);
  const step = Math.max(1, Math.floor(validPixels.length / particleCount));

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const scale = 1.5;

  for (let i = 0; i < particleCount; i++) {
    const pixel = validPixels[Math.min(i * step, validPixels.length - 1)];
    const i3 = i * 3;

    positions[i3] = pixel.x * scale;
    positions[i3 + 1] = pixel.y * scale;
    positions[i3 + 2] = (Math.random() - 0.5) * 20;

    // Gradient color
    const t = (pixel.x + canvas.width / 2) / canvas.width;
    colors[i3] = 0.1 + t * 0.8;
    colors[i3 + 1] = 0.6;
    colors[i3 + 2] = 1.0 - t * 0.3;
  }

  return { positions, colors };
}

// Generate particles from 3D model (GLTF/GLB)
export async function generateParticlesFromModel(
  modelUrl: string,
  maxParticles: number
): Promise<{ positions: Float32Array; colors: Float32Array }> {
  // Dynamically import GLTFLoader
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      modelUrl,
      (gltf) => {
        const positions: number[] = [];
        const colors: number[] = [];

        // Extract vertices from all meshes
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const geometry = mesh.geometry;
            const positionAttr = geometry.getAttribute('position');
            const colorAttr = geometry.getAttribute('color');

            for (let i = 0; i < positionAttr.count; i++) {
              // Convert to world coordinates
              const vertex = new THREE.Vector3(
                positionAttr.getX(i),
                positionAttr.getY(i),
                positionAttr.getZ(i)
              );
              vertex.applyMatrix4(mesh.matrixWorld);

              positions.push(vertex.x * 50, vertex.y * 50, vertex.z * 50);

              // Color
              if (colorAttr) {
                colors.push(
                  colorAttr.getX(i),
                  colorAttr.getY(i),
                  colorAttr.getZ(i)
                );
              } else {
                colors.push(0.5, 0.7, 1.0);
              }
            }
          }
        });

        // Sampling
        const particleCount = Math.min(maxParticles, positions.length / 3);
        const step = Math.max(1, Math.floor(positions.length / 3 / particleCount));

        const sampledPositions = new Float32Array(particleCount * 3);
        const sampledColors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          const srcIdx = i * step * 3;
          const dstIdx = i * 3;

          sampledPositions[dstIdx] = positions[srcIdx];
          sampledPositions[dstIdx + 1] = positions[srcIdx + 1];
          sampledPositions[dstIdx + 2] = positions[srcIdx + 2];

          sampledColors[dstIdx] = colors[srcIdx];
          sampledColors[dstIdx + 1] = colors[srcIdx + 1];
          sampledColors[dstIdx + 2] = colors[srcIdx + 2];
        }

        resolve({ positions: sampledPositions, colors: sampledColors });
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

// Import THREE namespace
import * as THREE from 'three';

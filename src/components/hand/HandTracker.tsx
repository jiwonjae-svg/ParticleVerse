'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore, HandGesture } from '@/store/useAppStore';

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface HandResult {
  multiHandLandmarks: HandLandmark[][];
  multiHandedness: { label: string }[];
}

// MediaPipe types
interface MediaPipeHands {
  setOptions: (options: {
    maxNumHands: number;
    modelComplexity: number;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }) => void;
  onResults: (callback: (results: HandResult) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

interface MediaPipeCamera {
  start: () => Promise<void>;
  stop: () => void;
}

// Detect mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

export default function HandTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<MediaPipeHands | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const animationRef = useRef<number>();
  const mountedRef = useRef<boolean>(true);
  // Track actual video dimensions for correct coordinate mapping
  const videoDimensionsRef = useRef<{ width: number; height: number }>({ width: 640, height: 480 });
  // Track viewport dimensions for responsive coordinate mapping
  const viewportDimensionsRef = useRef<{ width: number; height: number }>({ width: window?.innerWidth || 1920, height: window?.innerHeight || 1080 });

  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  const { 
    handSettings, 
    setHandPosition, 
    setCurrentGesture,
  } = useAppStore();

  // Detect and update mobile state and viewport dimensions
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
      viewportDimensionsRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    };
    checkMobile();

    const handleResize = () => {
      checkMobile();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      // Delay to allow browser to update dimensions after orientation change
      setTimeout(handleResize, 200);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Gesture detection
  const detectGesture = useCallback((landmarks: HandLandmark[]): HandGesture => {
    if (!landmarks || landmarks.length < 21) return 'none';

    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];
    const fingerExtended: boolean[] = [];

    fingerExtended.push(landmarks[4].x < landmarks[3].x);

    for (let i = 1; i < 5; i++) {
      fingerExtended.push(landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y);
    }

    const extendedCount = fingerExtended.filter(Boolean).length;

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const pinchDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow(thumbTip.z - indexTip.z, 2)
    );

    if (pinchDistance < 0.05) {
      return 'pinch';
    }

    if (extendedCount >= 4) {
      return 'open';
    } else if (extendedCount <= 1) {
      return 'closed';
    } else if (fingerExtended[1] && !fingerExtended[2] && !fingerExtended[3] && !fingerExtended[4]) {
      return 'point';
    } else if (fingerExtended[1] && fingerExtended[2] && !fingerExtended[3] && !fingerExtended[4]) {
      return 'peace';
    }

    return 'none';
  }, []);

  // Convert hand landmark to 3D coordinates
  // Accounts for actual video aspect ratio and viewport dimensions
  const landmarkTo3D = useCallback((landmark: HandLandmark): { x: number; y: number; z: number } => {
    const sensitivity = handSettings.sensitivity;
    const viewport = viewportDimensionsRef.current;
    const aspectRatio = viewport.width / viewport.height;
    
    // Compute visible area from camera FOV (60°) at z=0, camera at z=300
    const halfFovRad = (60 / 2) * Math.PI / 180; // 30 degrees
    const cameraDistance = 300;
    const visibleHeight = Math.tan(halfFovRad) * cameraDistance * 2; // ~346
    const visibleWidth = visibleHeight * aspectRatio;
    
    return {
      // Negate X: webcam is mirrored, so MediaPipe x=0 (video left) = screen right
      x: -(landmark.x - 0.5) * visibleWidth * sensitivity,
      y: -(landmark.y - 0.5) * visibleHeight * sensitivity,
      z: -landmark.z * 200 * sensitivity,
    };
  }, [handSettings.sensitivity]);

  // Process hand tracking results
  const onResults = useCallback((results: HandResult) => {
    if (!canvasRef.current || !mountedRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i]?.label;

        const palmCenter = landmarks[9];
        const position3D = landmarkTo3D(palmCenter);

        if (handedness === 'Left') {
          setHandPosition('left', position3D);
        } else {
          setHandPosition('right', position3D);
        }

        if (handSettings.gestureEnabled) {
          const gesture = detectGesture(landmarks);
          setCurrentGesture(gesture);
        }

        // Debug visualization
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvasRef.current.width, 0);

        ctx.fillStyle = handedness === 'Left' ? '#0ea5e9' : '#d946ef';
        for (const landmark of landmarks) {
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvasRef.current.width,
            landmark.y * canvasRef.current.height,
            3,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }

        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [0, 9], [9, 10], [10, 11], [11, 12],
          [0, 13], [13, 14], [14, 15], [15, 16],
          [0, 17], [17, 18], [18, 19], [19, 20],
          [5, 9], [9, 13], [13, 17]
        ];

        ctx.strokeStyle = handedness === 'Left' ? 'rgba(14, 165, 233, 0.5)' : 'rgba(217, 70, 239, 0.5)';
        ctx.lineWidth = 2;

        for (const [start, end] of connections) {
          ctx.beginPath();
          ctx.moveTo(
            landmarks[start].x * canvasRef.current.width,
            landmarks[start].y * canvasRef.current.height
          );
          ctx.lineTo(
            landmarks[end].x * canvasRef.current.width,
            landmarks[end].y * canvasRef.current.height
          );
          ctx.stroke();
        }

        ctx.restore();
      }
    } else {
      setHandPosition('left', null);
      setHandPosition('right', null);
      setCurrentGesture('none');
    }
  }, [landmarkTo3D, detectGesture, setHandPosition, setCurrentGesture, handSettings.gestureEnabled]);

  // MediaPipe initialization - mobile-aware setup
  useEffect(() => {
    if (!handSettings.enabled) {
      return;
    }

    mountedRef.current = true;
    let cleanupCalled = false;

    const initializeHands = async () => {
      try {
        setInitProgress('Loading MediaPipe...');
        
        // Load MediaPipe via script tags (avoids WASM errors)
        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            // Skip if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
          });
        };

        // Load MediaPipe scripts sequentially (jsdelivr CDN)
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js');

        if (cleanupCalled || !mountedRef.current) return;

        // Get MediaPipe from global scope
        const win = window as unknown as {
          Hands: new (config: { locateFile: (file: string) => string }) => MediaPipeHands;
          Camera: new (
            video: HTMLVideoElement,
            config: { onFrame: () => Promise<void>; width: number; height: number; facingMode?: string }
          ) => MediaPipeCamera;
        };

        if (!win.Hands || !win.Camera) {
          throw new Error('MediaPipe failed to load');
        }

        if (!videoRef.current || !canvasRef.current) return;

        setInitProgress('Initializing hand detection...');

        // Determine mobile status and set appropriate settings
        const mobile = isMobileDevice();

        // Configure Hands - use lower complexity on mobile for performance
        const hands = new win.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: mobile ? 0 : 1, // Lower complexity on mobile
          minDetectionConfidence: mobile ? 0.6 : 0.7,
          minTrackingConfidence: mobile ? 0.4 : 0.5,
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        setInitProgress('Starting camera...');

        // Camera resolution adapts to device type and orientation
        const camWidth = mobile ? 320 : 640;
        const camHeight = mobile ? 240 : 480;

        // Store actual video dimensions for coordinate mapping
        videoDimensionsRef.current = { width: camWidth, height: camHeight };

        // Configure camera - use front-facing camera on mobile
        const camera = new win.Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && videoRef.current && mountedRef.current) {
              try {
                await handsRef.current.send({ image: videoRef.current });
              } catch (e) {
                // Ignore frame send errors (may occur during cleanup)
              }
            }
          },
          width: camWidth,
          height: camHeight,
        });

        cameraRef.current = camera;
        await camera.start();

        if (mountedRef.current) {
          setIsInitialized(true);
          setCameraError(null);
          setInitProgress('');
        }
      } catch (error) {
        console.error('Hand tracking initialization failed:', error);
        if (mountedRef.current) {
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            setCameraError('Camera permission required. Please allow camera access.');
          } else if (error instanceof DOMException && error.name === 'NotFoundError') {
            setCameraError('No camera found. Please connect a camera.');
          } else {
            setCameraError('Failed to initialize hand tracking. Please refresh and try again.');
          }
        }
      }
    };

    initializeHands();

    return () => {
      cleanupCalled = true;
      mountedRef.current = false;
      
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handSettings.enabled, onResults]);

  if (!handSettings.enabled) {
    return null;
  }

  return (
    <>
      {/* Video element (hidden) */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Debug canvas */}
      {isInitialized && (
        <canvas
          ref={canvasRef}
          width={isMobile ? 160 : 320}
          height={isMobile ? 120 : 240}
          className="fixed bottom-4 right-4 w-40 h-30 rounded-lg border border-dark-600 opacity-50 hover:opacity-100 transition-opacity z-50"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}

      {/* Error message */}
      {cameraError && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm z-50 max-w-xs">
          {cameraError}
        </div>
      )}

      {/* Loading state */}
      {!isInitialized && !cameraError && (
        <div className="fixed bottom-4 right-4 bg-dark-800/90 text-white px-4 py-2 rounded-lg text-sm z-50 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {initProgress || 'Initializing camera...'}
        </div>
      )}

      {/* Hidden canvas (before initialization) */}
      {!isInitialized && (
        <canvas
          ref={canvasRef}
          width={isMobile ? 160 : 320}
          height={isMobile ? 120 : 240}
          className="hidden"
        />
      )}
    </>
  );
}

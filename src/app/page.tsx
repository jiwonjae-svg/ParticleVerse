'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ThemeProvider from '@/components/providers/ThemeProvider';
import { decodeSettingsFromURL } from '@/utils/stateSharing';

// Optimize code splitting with dynamic imports
const Scene = dynamic(() => import('@/components/three/Scene'), {
  ssr: false,
  loading: () => <LoadingScreen />
});

const UIOverlay = dynamic(() => import('@/components/ui/UIOverlay'), {
  ssr: false
});

const HandTracker = dynamic(() => import('@/components/hand/HandTracker'), {
  ssr: false
});

const AudioAnalyzer = dynamic(() => import('@/components/audio/AudioAnalyzer'), {
  ssr: false
});

export default function Home() {
  // Apply shared settings from URL on mount
  useEffect(() => {
    decodeSettingsFromURL();
  }, []);

  return (
    <ThemeProvider>
      <main className="relative w-screen h-screen overflow-hidden bg-black">
        {/* 3D Scene */}
        <div className="canvas-container">
          <Suspense fallback={<LoadingScreen />}>
            <Scene />
          </Suspense>
        </div>

        {/* Hand tracking */}
        <HandTracker />

        {/* Audio analyzer */}
        <AudioAnalyzer />

        {/* UI overlay */}
        <UIOverlay />
      </main>
    </ThemeProvider>
  );
}

'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Always use dark mode
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.setProperty('--bg-primary', '0, 0, 0');
    root.style.setProperty('--bg-secondary', '15, 23, 42');
    root.style.setProperty('--bg-panel', 'rgba(15, 23, 42, 0.7)');
    root.style.setProperty('--bg-hover', 'rgba(30, 41, 59, 0.8)');
    root.style.setProperty('--text-primary', '255, 255, 255');
    root.style.setProperty('--text-secondary', '148, 163, 184');
    root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--scrollbar-track', 'rgba(15, 23, 42, 0.5)');
    root.style.setProperty('--scrollbar-thumb', 'rgba(14, 165, 233, 0.5)');
    root.style.setProperty('--scrollbar-thumb-hover', 'rgba(14, 165, 233, 0.8)');
    body.style.backgroundColor = '#000';
    body.style.color = '#fff';
  }, []);

  return <>{children}</>;
}

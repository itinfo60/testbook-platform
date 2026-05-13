import { useState, useEffect } from 'react';

export default function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.documentElement.style.setProperty('--toast-bg', '#1f2937');
      document.documentElement.style.setProperty('--toast-color', '#f3f4f6');
      document.documentElement.style.setProperty('--toast-border', '#374151');
    } else {
      root.classList.remove('dark');
      document.documentElement.style.setProperty('--toast-bg', '#fff');
      document.documentElement.style.setProperty('--toast-color', '#1f2937');
      document.documentElement.style.setProperty('--toast-border', '#e5e7eb');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  return [darkMode, setDarkMode];
}

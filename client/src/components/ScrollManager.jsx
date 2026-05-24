import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Stores scroll Y per location key so back-navigation restores position
const scrollPositions = {};

export default function ScrollManager() {
  const { pathname, key } = useLocation();
  const prevKey = useRef(key);

  useEffect(() => {
    // Tell the browser we manage scroll manually
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Save previous page's scroll position before leaving
    scrollPositions[prevKey.current] = window.scrollY;
    prevKey.current = key;

    // Determine if this is a back/forward navigation (POP) by checking if we
    // already have a saved position for this key
    const saved = scrollPositions[key];
    if (saved !== undefined) {
      // Restore saved position (back/forward navigation)
      // Use requestAnimationFrame to wait for the page to render
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved, behavior: 'instant' });
      });
    } else {
      // New navigation — go to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [key, pathname]);

  return null;
}

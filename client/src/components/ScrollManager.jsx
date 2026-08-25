import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import logger from '@/services/logger';

// Stores scroll Y per location key so back-navigation restores position
const scrollPositions = {};

export default function ScrollManager() {
  const location = useLocation();
  const { pathname, key, state, search } = location;
  const prevKey = useRef(key);

  useEffect(() => {
    logger.pageView(pathname + (search || ''));
  }, [pathname, search]);

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

    // Check if this navigation explicitly opts out of scrolling
    if (state?.preventScroll) {
      return;
    }

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
  }, [key, pathname, state]);

  return null;
}

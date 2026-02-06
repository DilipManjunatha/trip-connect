import { useState, useEffect } from 'react';

/**
 * Returns true when the viewport matches the given media query.
 * Uses Tailwind md breakpoint (768px) by default for "mobile" detection.
 */
export function useMediaQuery(query: string = '(max-width: 767px)'): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** True when viewport is below Tailwind md (768px). Use for mobile-only UI (e.g. bottom sheet). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

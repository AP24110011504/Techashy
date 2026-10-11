import { useState, useEffect, useCallback } from 'react';

/**
 * Lightweight client-side router hook that integrates natively
 * with HTML5 History API (pushState, popState), ensuring browser back/forward,
 * clean bookmarkable URLs, and zero React 19 dependency conflict issues.
 */
export function useRouter() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path && path !== '' ? path : '/';
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    const handleCustomNavigate = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('aegisx-navigate', handleCustomNavigate);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('aegisx-navigate', handleCustomNavigate);
    };
  }, []);

  const navigate = useCallback((to) => {
    if (typeof window !== 'undefined' && window.location.pathname !== to) {
      window.history.pushState(null, '', to);
      window.dispatchEvent(new Event('aegisx-navigate'));
      setCurrentPath(to);
      window.scrollTo(0, 0);
    }
  }, []);

  return { currentPath, navigate };
}

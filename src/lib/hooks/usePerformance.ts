"use client";

import { useEffect, useState } from 'react';
import { trackPageView, trackEvent, trackLoadTime } from '@/lib/services/performanceService';

/**
 * Hook for tracking page performance and analytics (Client Component only)
 */
export function usePerformance(pageName: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadTime, setLoadTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();

    // Track page view
    trackPageView(pageName);

    // Simulate content loading
    const handleLoad = () => {
      const endTime = performance.now();
      const loadTimeMs = Math.round(endTime - startTime);
      setLoadTime(loadTimeMs);
      setIsLoaded(true);

      // Track performance
      trackLoadTime(pageName, loadTimeMs);
    };

    // For SPA navigation, we need to handle route changes
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [pageName]);

  // Track user interactions
  const trackInteraction = (action: string, label?: string, value?: number) => {
    trackEvent('User Interaction', action, label, value);
  };

  return { isLoaded, loadTime, trackInteraction };
}

/**
 * Hook for tracking specific component interactions (Client Component only)
 */
export function useComponentTracking(componentName: string) {
  const trackInteraction = (action: string, label?: string, value?: number) => {
    trackEvent('Component Interaction', `${componentName}:${action}`, label, value);
  };

  return { trackInteraction };
}
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Import analytics to trigger auto-initialization
import '@/lib/analytics';
import { trackPageView, forceFlush } from '@/lib/analytics';

/**
 * Analytics Initializer
 * Ensures analytics loads on every page and tracks route changes
 */
export function AnalyticsInit() {
  const pathname = usePathname();

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  // Flush analytics when navigating away
  useEffect(() => {
    return () => {
      // Flush pending events when component unmounts (route change)
      forceFlush();
    };
  }, [pathname]);

  return null; // This component doesn't render anything
}

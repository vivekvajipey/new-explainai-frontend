import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: {
        page_path?: string;
        [key: string]: string | number | boolean | null | undefined;
      }
    ) => void;
  }
}

export const useGoogleAnalytics = () => {
  const router = useRouter();

  const trackEvent = useCallback((category: string, action: string, label?: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      console.log('GA Event:', { category, action, label, value }); // Add this line
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
          page_path: url,
        });
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return { trackEvent };
};
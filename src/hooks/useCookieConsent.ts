import { useEffect, useState } from 'react';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'techne_cookie_consent';

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const loadConsent = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setConsent(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing cookie consent:', e);
        }
      }
    };

    loadConsent();

    const handleConsentUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CookiePreferences>;
      setConsent(customEvent.detail);
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);
    return () => window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
  }, []);

  const hasConsent = (category: 'essential' | 'analytics' | 'marketing'): boolean => {
    return consent?.[category] ?? false;
  };

  return { consent, hasConsent };
};

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Gera um ID único para o visitante (armazenado no localStorage)
const getVisitorId = (): string => {
  if (typeof window === 'undefined') return 'ssr_visitor';
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// Gera um ID único para a sessão (válido por 30 minutos)
const getSessionId = (): string => {
  const sessionKey = 'session_id';
  const sessionTimeKey = 'session_time';
  const now = Date.now();
  const sessionTimeout = 30 * 60 * 1000; // 30 minutos

  let sessionId = sessionStorage.getItem(sessionKey);
  const sessionTime = sessionStorage.getItem(sessionTimeKey);

  if (!sessionId || !sessionTime || now - parseInt(sessionTime) > sessionTimeout) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(sessionKey, sessionId);
    sessionStorage.setItem(sessionTimeKey, now.toString());
  }

  return sessionId;
};

// Detecta o tipo de dispositivo
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'Mobile';
  if (/tablet/i.test(ua)) return 'Tablet';
  return 'Desktop';
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Não rastrear páginas admin
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    const trackPageView = async () => {
      try {
        await supabase.functions.invoke('track-visit', {
          body: {
            page_path: location.pathname,
            visitor_id: getVisitorId(),
            session_id: getSessionId(),
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            device_type: getDeviceType(),
          },
        });
      } catch (error) {
        // Silenciosamente falhar se não conseguir rastrear
        console.debug('Tracking error:', error);
      }
    };

    trackPageView();
  }, [location.pathname]);
};

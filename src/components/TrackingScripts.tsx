import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCookieConsent } from '@/hooks/useCookieConsent';

interface SiteSettings {
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  custom_head_scripts?: string;
  custom_body_scripts?: string;
}

export const TrackingScripts = () => {
  const { hasConsent } = useCookieConsent();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [bodyScripts, setBodyScripts] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('google_analytics_id, facebook_pixel_id, custom_head_scripts, custom_body_scripts')
        .single();

      if (data) {
        setSettings(data);
        if (data.custom_body_scripts) {
          setBodyScripts(data.custom_body_scripts);
        }
      }
    } catch (error) {
      console.debug('Could not load tracking settings:', error);
    }
  };

  // Injetar scripts no body (apenas com consentimento de marketing)
  useEffect(() => {
    if (bodyScripts && hasConsent('marketing')) {
      const scriptContainer = document.createElement('div');
      scriptContainer.innerHTML = bodyScripts;
      document.body.appendChild(scriptContainer);

      return () => {
        if (document.body.contains(scriptContainer)) {
          document.body.removeChild(scriptContainer);
        }
      };
    }
  }, [bodyScripts, hasConsent]);

  // Injetar Google Analytics (apenas com consentimento)
  useEffect(() => {
    if (settings.google_analytics_id && hasConsent('analytics')) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        
        gtag('consent', 'default', {
          'analytics_storage': 'granted',
          'ad_storage': '${hasConsent('marketing') ? 'granted' : 'denied'}'
        });
        
        gtag('config', '${settings.google_analytics_id}', {
          'anonymize_ip': true
        });
      `;
      document.head.appendChild(script2);

      return () => {
        if (document.head.contains(script1)) {
          document.head.removeChild(script1);
        }
        if (document.head.contains(script2)) {
          document.head.removeChild(script2);
        }
      };
    }
  }, [settings.google_analytics_id, hasConsent]);

  // Injetar Facebook Pixel (apenas com consentimento de marketing)
  useEffect(() => {
    if (settings.facebook_pixel_id && hasConsent('marketing')) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${settings.facebook_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [settings.facebook_pixel_id, hasConsent]);

  // Injetar scripts personalizados do head (apenas com consentimento de marketing)
  useEffect(() => {
    if (settings.custom_head_scripts && hasConsent('marketing')) {
      const container = document.createElement('div');
      container.innerHTML = settings.custom_head_scripts;
      Array.from(container.children).forEach(child => {
        document.head.appendChild(child);
      });

      return () => {
        Array.from(container.children).forEach(child => {
          if (document.head.contains(child)) {
            document.head.removeChild(child);
          }
        });
      };
    }
  }, [settings.custom_head_scripts, hasConsent]);

  return null;
};

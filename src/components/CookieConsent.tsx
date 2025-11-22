import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { Cookie, Shield, BarChart3, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CookiePreferences } from '@/hooks/useCookieConsent';

const STORAGE_KEY = 'techne_cookie_consent';
const CONSENT_VERSION = '1.0';

export const CookieConsent = () => {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: Date.now()
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
          detail: parsed 
        }));
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const consentData = {
      ...prefs,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: consentData 
    }));
    
    window.location.reload();
  };

  const acceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    });
    setShowBanner(false);
    setShowPreferences(false);
  };

  const rejectNonEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    });
    setShowBanner(false);
    setShowPreferences(false);
  };

  const savePreferences = () => {
    saveConsent(preferences);
    setShowPreferences(false);
    setShowBanner(false);
  };

  const openPreferences = () => {
    setShowPreferences(true);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner Inicial */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur border-t border-border shadow-lg">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <Cookie className="h-8 w-8 text-primary flex-shrink-0" />
            
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                {t('cookies.banner.title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('cookies.banner.description')}{' '}
                <Link to="/privacy" className="underline hover:text-foreground transition-colors">
                  {t('cookies.banner.privacy')}
                </Link>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button onClick={acceptAll} size="sm" className="whitespace-nowrap">
                {t('cookies.banner.accept')}
              </Button>
              <Button onClick={rejectNonEssential} variant="outline" size="sm" className="whitespace-nowrap">
                {t('cookies.banner.reject')}
              </Button>
              <Button onClick={openPreferences} variant="ghost" size="sm" className="whitespace-nowrap">
                {t('cookies.banner.manage')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Preferências */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('cookies.preferences.title')}</DialogTitle>
            <DialogDescription>
              {t('cookies.preferences.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Cookies Essenciais */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">
                    {t('cookies.essential.title')}
                  </CardTitle>
                </div>
                <Switch checked={true} disabled />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.essential.description')}
                </p>
              </CardContent>
            </Card>
            
            {/* Cookies de Analytics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">
                    {t('cookies.analytics.title')}
                  </CardTitle>
                </div>
                <Switch 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => 
                    setPreferences(p => ({...p, analytics: checked}))
                  }
                />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('cookies.analytics.description')}
                </p>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <strong>Ferramentas:</strong> Google Analytics
                </div>
              </CardContent>
            </Card>
            
            {/* Cookies de Marketing */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-base">
                    {t('cookies.marketing.title')}
                  </CardTitle>
                </div>
                <Switch 
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => 
                    setPreferences(p => ({...p, marketing: checked}))
                  }
                />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('cookies.marketing.description')}
                </p>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <strong>Ferramentas:</strong> Facebook Pixel, Scripts Personalizados
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={rejectNonEssential} variant="outline" className="w-full sm:w-auto">
              {t('cookies.rejectAll')}
            </Button>
            <Button onClick={savePreferences} variant="secondary" className="w-full sm:w-auto flex-1">
              {t('cookies.save')}
            </Button>
            <Button onClick={acceptAll} className="w-full sm:w-auto">
              {t('cookies.acceptAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

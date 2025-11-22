import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { Cookie, Shield, BarChart3, Target } from 'lucide-react';
import type { CookiePreferences } from '@/hooks/useCookieConsent';

const STORAGE_KEY = 'techne_cookie_consent';
const CONSENT_VERSION = '1.0';

export const CookiePreferencesButton = () => {
  const { t } = useLanguage();
  const [hasConsent, setHasConsent] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: Date.now()
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setHasConsent(true);
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      } catch (e) {
        console.error('Error loading cookie preferences:', e);
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
    setShowPreferences(false);
  };

  const rejectNonEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    });
    setShowPreferences(false);
  };

  const savePreferences = () => {
    saveConsent(preferences);
    setShowPreferences(false);
  };

  if (!hasConsent) return null;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 z-40 rounded-full shadow-lg"
        onClick={() => setShowPreferences(true)}
        title={t('cookies.banner.manage')}
      >
        <Cookie className="h-4 w-4" />
      </Button>
      
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

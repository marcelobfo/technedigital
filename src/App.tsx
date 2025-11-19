import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Newsletter from "./pages/admin/Newsletter";
import SiteSettings from "./pages/admin/SiteSettings";
import WhatsAppSettings from "./pages/admin/WhatsAppSettings";
import Analytics from "./pages/admin/Analytics";
import { TrackingScripts } from "@/components/TrackingScripts";
import { AppContent } from "@/components/AppContent";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <TrackingScripts />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

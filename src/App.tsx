import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import PortfolioProject from "./pages/PortfolioProject";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Login from "./pages/admin/Login";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Leads from "./pages/admin/Leads";
import Proposals from "./pages/admin/Proposals";
import BlogPosts from "./pages/admin/BlogPosts";
import PortfolioAdmin from "./pages/admin/Portfolio";
import ServicesAdmin from "./pages/admin/Services";
import TestimonialsAdmin from "./pages/admin/Testimonials";
import Users from "./pages/admin/Users";
import ProposalEditor from "./pages/admin/ProposalEditor";
import AdminSettings from "./pages/admin/Settings";
import Newsletter from "./pages/admin/Newsletter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/portfolio/:slug" element={<PortfolioProject />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="posts" element={<BlogPosts />} />
                <Route path="portfolio" element={<PortfolioAdmin />} />
                <Route path="services" element={<ServicesAdmin />} />
                <Route path="testimonials" element={<TestimonialsAdmin />} />
                <Route path="users" element={<Users />} />
                <Route path="leads" element={<Leads />} />
                <Route path="proposals" element={<Proposals />} />
                <Route path="proposals/new" element={<ProposalEditor />} />
                <Route path="proposals/:id" element={<ProposalEditor />} />
                <Route path="newsletter" element={<Newsletter />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

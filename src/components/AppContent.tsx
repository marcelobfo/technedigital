import { Routes, Route } from "react-router-dom";
import { usePageTracking } from "@/hooks/usePageTracking";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Portfolio from "@/pages/Portfolio";
import PortfolioProject from "@/pages/PortfolioProject";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/admin/Login";
import AdminLayout from "@/components/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Leads from "@/pages/admin/Leads";
import Proposals from "@/pages/admin/Proposals";
import BlogPosts from "@/pages/admin/BlogPosts";
import PortfolioAdmin from "@/pages/admin/Portfolio";
import ServicesAdmin from "@/pages/admin/Services";
import TestimonialsAdmin from "@/pages/admin/Testimonials";
import Users from "@/pages/admin/Users";
import ProposalEditor from "@/pages/admin/ProposalEditor";
import AdminSettings from "@/pages/admin/Settings";
import Newsletter from "@/pages/admin/Newsletter";
import SiteSettings from "@/pages/admin/SiteSettings";
import WhatsAppSettings from "@/pages/admin/WhatsAppSettings";
import EmailSettings from "@/pages/admin/EmailSettings";
import Analytics from "@/pages/admin/Analytics";
import Financial from "@/pages/admin/Financial";
import GoogleSearchConsole from "@/pages/admin/GoogleSearchConsole";
import GoogleOAuthCallback from "@/pages/admin/GoogleOAuthCallback";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

export const AppContent = () => {
  usePageTracking(); // ✅ Agora está dentro do Router context

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/portfolio/:slug" element={<PortfolioProject />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/google-callback" element={<GoogleOAuthCallback />} />
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
        <Route path="financial" element={<Financial />} />
        <Route path="newsletter" element={<Newsletter />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="google-search-console" element={<GoogleSearchConsole />} />
        <Route path="site-settings" element={<SiteSettings />} />
        <Route path="whatsapp" element={<WhatsAppSettings />} />
        <Route path="email" element={<EmailSettings />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

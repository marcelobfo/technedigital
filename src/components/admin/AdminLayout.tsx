import { useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Settings, 
  MessageSquare, 
  Users,
  LogOut,
  Menu,
  Receipt,
  Wrench,
  Mail,
  BarChart3,
  Globe,
  MessageCircle,
  DollarSign,
  Search,
  Send
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: FileText, label: 'Blog Posts', path: '/admin/posts' },
  { icon: Briefcase, label: 'Portfólio', path: '/admin/portfolio' },
  { icon: Settings, label: 'Serviços', path: '/admin/services' },
  { icon: MessageSquare, label: 'Depoimentos', path: '/admin/testimonials' },
  { icon: Users, label: 'Leads', path: '/admin/leads' },
  { icon: Receipt, label: 'Propostas', path: '/admin/proposals' },
  { icon: DollarSign, label: 'Financeiro', path: '/admin/financial' },
  { icon: Mail, label: 'Newsletter', path: '/admin/newsletter' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Search, label: 'Google Search Console', path: '/admin/google-search-console' },
  { icon: Users, label: 'Usuários', path: '/admin/users' },
  { icon: Globe, label: 'Configurações do Site', path: '/admin/site-settings' },
  { icon: MessageCircle, label: 'WhatsApp', path: '/admin/whatsapp' },
  { icon: Send, label: 'Email', path: '/admin/email' },
  { icon: Wrench, label: 'Configurações', path: '/admin/settings' },
];

function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">TECHNE Admin</h2>
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, loading, rolesLoading, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AdminLayout auth state:', { user, loading, rolesLoading, isAdmin, isEditor });
    
    // Wait for both loading states to complete
    if (loading || rolesLoading) {
      console.log('Still loading, waiting...');
      return;
    }

    // Only redirect after roles are loaded
    if (!user) {
      console.log('No user, redirecting to login...');
      navigate('/admin/login');
      return;
    }
    
    // Check roles only after rolesLoading is false
    if (!isAdmin && !isEditor) {
      console.log('User has no admin/editor role, redirecting to home...');
      navigate('/');
    }
  }, [user, loading, rolesLoading, isAdmin, isEditor, navigate]);

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isEditor)) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-bold">TECHNE Admin</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar isMobile />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="lg:p-8 p-4 pt-20 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

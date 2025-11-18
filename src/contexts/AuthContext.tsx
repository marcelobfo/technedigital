import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  loading: boolean;
  rolesLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  const checkUserRole = async (userId: string) => {
    setRolesLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking role:', error);
        setIsAdmin(false);
        setIsEditor(false);
        return;
      }

      const roles = data?.map((r) => r.role) || [];
      setIsAdmin(roles.includes('admin'));
      setIsEditor(roles.includes('editor'));
      setIsViewer(roles.includes('viewer'));
    } finally {
      setRolesLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer role fetching to avoid deadlocks
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          // No authenticated user
          setIsAdmin(false);
          setIsEditor(false);
          setIsViewer(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    toast.success('Login realizado com sucesso!');
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/login`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    
    toast.success('Conta criada! Faça login para continuar.');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setIsAdmin(false);
    setIsEditor(false);
    setIsViewer(false);
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isEditor, isViewer, loading, rolesLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

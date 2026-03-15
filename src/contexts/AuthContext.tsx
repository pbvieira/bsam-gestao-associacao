import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'aluno' | 'auxiliar' | 'coordenador' | 'diretor' | 'administrador';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  area_id: string | null;
  setor_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isInitialized: boolean;
  permissionsLoading: boolean;
  canAccess: (module: string) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [accessibleModules, setAccessibleModules] = useState<string[]>([]);

  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing auth...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        throw error;
      }

      if (session?.user) {
        console.log('✅ Session found, fetching profile...');
        setSession(session);
        setUser(session.user);
        try {
          await fetchUserProfile(session.user.id);
        } catch (error) {
          console.error('❌ Profile not found, signing out invalid session...');
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          setAccessibleModules([]);
        }
      } else {
        console.log('ℹ️ No active session found');
      }
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
    } finally {
      setLoading(false);
      setIsInitialized(true);
      console.log('✅ Auth initialization complete');
    }
  };

  const fetchUserProfile = async (userId: string) => {
    console.log('🔍 Fetching user profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        throw error;
      }

      console.log('✅ Profile fetched successfully:', data);
      setProfile(data);
      
      // Buscar módulos acessíveis após definir o profile
      await fetchAccessibleModules(data.role);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      setProfile(null);
      throw error;
    }
  };

  const fetchAccessibleModules = async (role: UserRole) => {
    setPermissionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_module_access')
        .select('module')
        .eq('role', role)
        .eq('allowed', true);

      if (error) {
        console.error('❌ Error fetching accessible modules:', error);
        // Fallback para módulos básicos
        setAccessibleModules(['dashboard']);
        return;
      }

      const modules = data.map(item => item.module);
      console.log('✅ Accessible modules fetched:', modules);
      setAccessibleModules(modules);
    } catch (error) {
      console.error('❌ Failed to fetch accessible modules:', error);
      setAccessibleModules(['dashboard']);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Função simplificada para verificar acesso a módulos baseado no cache local
  const canAccess = (module: string): boolean => {
    const access = accessibleModules.includes(module);
    console.log(`🔍 Role-based access check - ${profile?.role} can access ${module}:`, access);
    return access;
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Attempting sign in for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { error };
      }

      console.log('✅ Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('📝 Attempting sign up for:', email);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { error };
      }

      console.log('✅ Sign up successful');
      return { error: null };
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      setAccessibleModules([]);
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        // Ignorar eventos de refresh que não mudam o usuário
        if (event === 'TOKEN_REFRESHED' && session?.user?.id === user?.id) {
          console.log('ℹ️ Token refreshed, skipping profile reload');
          setSession(session);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Só buscar perfil se for um novo usuário ou se ainda não temos perfil
          if (!profile || profile.user_id !== session.user.id) {
            setTimeout(() => {
              fetchUserProfile(session.user.id).catch(async (error) => {
                console.error('❌ Profile not found after auth change, signing out...', error);
                await supabase.auth.signOut();
                setUser(null);
                setSession(null);
                setProfile(null);
                setAccessibleModules([]);
              });
            }, 0);
          }
        } else {
          setProfile(null);
          setAccessibleModules([]);
          setPermissionsLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isInitialized,
    permissionsLoading,
    canAccess,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
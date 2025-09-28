import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { canAccessModule } from '@/lib/role-access';

export type UserRole = 'aluno' | 'auxiliar' | 'coordenador' | 'diretor' | 'administrador';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isInitialized: boolean;
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
        await fetchUserProfile(session.user.id);
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
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      setProfile(null);
      throw error;
    }
  };

  // Função simplificada para verificar acesso a módulos baseado no role
  const canAccess = (module: string): boolean => {
    const access = canAccessModule(profile?.role, module);
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
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetching to avoid potential deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id).catch(error => {
              console.error('❌ Failed to fetch profile after auth change:', error);
            });
          }, 0);
        } else {
          setProfile(null);
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
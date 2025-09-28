import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

interface Permission {
  id: string;
  role: UserRole;
  module: string;
  action: string;
  allowed: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  permissions: Permission[];
  loading: boolean;
  isInitialized: boolean;
  hasPermission: (module: string, action?: string) => boolean;
  canAccess: (module: string) => boolean;
  reloadPermissions: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cache permissions by role to avoid repeated requests
  const [permissionsCache, setPermissionsCache] = useState<Record<UserRole, Permission[]>>({} as Record<UserRole, Permission[]>);

  useEffect(() => {
    // Initialize auth state
    initializeAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Only synchronous state updates in the callback
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer async operations to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setPermissions([]);
          setLoading(false);
          setIsInitialized(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
        setPermissions([]);
        return;
      }

      setProfile(profileData);
      
      if (profileData?.role) {
        await fetchPermissions(profileData.role);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setProfile(null);
      setPermissions([]);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const fetchPermissions = async (role: UserRole) => {
    try {
      // Check cache first
      if (permissionsCache[role]) {
        console.log('Using cached permissions for role:', role);
        setPermissions(permissionsCache[role]);
        return;
      }

      console.log('Fetching permissions for role:', role);
      
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('role', role)
        .eq('allowed', true);

      if (error) {
        console.error('Permission fetch error:', error);
        throw error;
      }
      
      const fetchedPermissions = data || [];
      console.log('Permissions fetched:', fetchedPermissions.length, fetchedPermissions);
      
      // Cache the permissions
      setPermissionsCache(prev => ({
        ...prev,
        [role]: fetchedPermissions
      }));
      
      setPermissions(fetchedPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    }
  };

  // Função de debug para logs detalhados
  const debugPermissions = (module: string, action: string = 'read') => {
    console.log('🔍 Verificando permissão:', { 
      module, 
      action, 
      userRole: profile?.role,
      totalPermissions: permissions.length,
      permissionsForModule: permissions.filter(p => p.module === module),
      specificPermission: permissions.find(p => p.module === module && p.action === action)
    });
  };

  const hasPermission = (module: string, action: string = 'read'): boolean => {
    if (!profile || !permissions.length) {
      console.log('❌ Sem profile ou permissões:', { profile: !!profile, permissions: permissions.length });
      return false;
    }

    // Debug detalhado
    debugPermissions(module, action);

    const hasAccess = permissions.some(
      (permission) =>
        permission.module === module &&
        permission.action === action &&
        permission.allowed
    );

    console.log('✅ Resultado hasPermission:', { module, action, hasAccess });
    return hasAccess;
  };

  const canAccess = (module: string): boolean => {
    if (!profile || !permissions.length) {
      console.log('❌ Sem profile ou permissões para canAccess:', { profile: !!profile, permissions: permissions.length });
      return false;
    }

    // Simplificado: se tem qualquer permissão allowed no módulo, pode acessar
    const hasAccess = permissions.some(
      (permission) =>
        permission.module === module &&
        permission.allowed
    );

    console.log('✅ Resultado canAccess:', { module, hasAccess, permissionsForModule: permissions.filter(p => p.module === module) });
    return hasAccess;
  };

  // Função para forçar reload das permissões (útil para debug)
  const reloadPermissions = async () => {
    if (profile?.role) {
      console.log('🔄 Forçando reload das permissões...');
      setPermissionsCache({} as Record<UserRole, Permission[]>);
      await fetchPermissions(profile.role);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPermissions([]);
    setPermissionsCache({} as Record<UserRole, Permission[]>);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    permissions,
    loading,
    isInitialized,
    hasPermission,
    canAccess,
    reloadPermissions,
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
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserRole } from './use-auth';

export interface Permission {
  id: string;
  role: UserRole;
  module: string;
  action: string;
  allowed: boolean;
  created_at: string;
}

export function usePermissions() {
  const { profile, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Wait for auth to be stable before processing permissions
    if (authLoading) {
      return;
    }

    // Auth is stable, now we can process
    if (profile?.role) {
      fetchPermissions(profile.role);
    } else {
      // No profile means no permissions
      setPermissions([]);
      setLoading(false);
      setIsInitialized(true);
    }
  }, [profile, authLoading]);

  const fetchPermissions = async (role: UserRole) => {
    try {
      setLoading(true);
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
      
      console.log('Permissions fetched:', data?.length || 0, data);
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    return permissions.some(
      (permission) =>
        permission.module === module &&
        permission.action === action &&
        permission.allowed
    );
  };

  const canAccess = (module: string): boolean => {
    return permissions.some(
      (permission) =>
        permission.module === module &&
        permission.allowed
    );
  };

  return {
    permissions,
    loading: authLoading || loading, // Loading if auth is loading OR permissions are loading
    isInitialized,
    hasPermission,
    canAccess,
  };
}
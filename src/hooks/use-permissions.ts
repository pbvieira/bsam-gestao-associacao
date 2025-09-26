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
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role) {
      fetchPermissions(profile.role);
    }
  }, [profile?.role]);

  const fetchPermissions = async (role: UserRole) => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('role', role)
        .eq('allowed', true);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
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
    loading,
    hasPermission,
    canAccess,
  };
}
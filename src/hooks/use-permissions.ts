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
    } else if (profile === null) {
      // No profile means no permissions
      setPermissions([]);
      setLoading(false);
    }
  }, [profile]);

  const fetchPermissions = async (role: UserRole) => {
    try {
      console.log('Fetching permissions for role:', role);
      
      // For directors, provide full access as fallback
      if (role === 'diretor') {
        console.log('Director detected, granting full access');
        const directorPermissions: Permission[] = [
          { id: 'temp-1', role, module: 'dashboard', action: 'read', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-2', role, module: 'students', action: 'read', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-3', role, module: 'students', action: 'write', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-4', role, module: 'students', action: 'delete', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-5', role, module: 'users', action: 'read', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-6', role, module: 'users', action: 'write', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-7', role, module: 'inventory', action: 'read', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-8', role, module: 'inventory', action: 'write', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-9', role, module: 'suppliers', action: 'read', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-10', role, module: 'suppliers', action: 'write', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-11', role, module: 'purchases', action: 'read', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-12', role, module: 'purchases', action: 'write', allowed: true, created_at: new Date().toISOString() },
          { id: 'temp-13', role, module: 'reports', action: 'read', allowed: true, created_at: new Date().toISOString() }
        ];
        setPermissions(directorPermissions);
        return;
      }

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
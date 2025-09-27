import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface StudentEmergencyContact {
  id: string;
  student_id: string;
  nome: string;
  telefone: string;
  parentesco: string | null;
  endereco: string | null;
  avisar_contato: boolean;
  created_at: string;
  updated_at: string;
}

export function useStudentEmergencyContacts(studentId?: string) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<StudentEmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('student_emergency_contacts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user, studentId]);

  const createContact = async (contactData: Omit<StudentEmergencyContact, 'id' | 'student_id' | 'created_at' | 'updated_at'>) => {
    if (!studentId || !user) return { error: 'Dados insuficientes' };

    try {
      const { data, error } = await supabase
        .from('student_emergency_contacts')
        .insert([{ 
          ...contactData, 
          student_id: studentId
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchContacts();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateContact = async (id: string, contactData: Partial<StudentEmergencyContact>) => {
    try {
      const { data, error } = await supabase
        .from('student_emergency_contacts')
        .update(contactData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchContacts();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('student_emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContacts();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact
  };
}
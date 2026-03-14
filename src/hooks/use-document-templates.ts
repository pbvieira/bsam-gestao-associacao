import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DocumentTemplate {
  id: string;
  slug: string;
  title: string;
  header_line1: string;
  header_line2: string;
  header_address: string;
  header_city: string;
  body_content: string;
  show_family_lines: boolean;
  family_lines_count: number;
  created_at: string;
  updated_at: string;
}

export function useDocumentTemplates() {
  return useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates' as any)
        .select('*')
        .order('title');

      if (error) throw error;
      return data as unknown as DocumentTemplate[];
    },
  });
}

export function useDocumentTemplate(slug: string) {
  return useQuery({
    queryKey: ['document-templates', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates' as any)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as unknown as DocumentTemplate;
    },
    enabled: !!slug,
  });
}

export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<DocumentTemplate, 'id' | 'slug' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await supabase
        .from('document_templates' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DocumentTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({
        title: 'Template atualizado',
        description: 'O template do documento foi salvo com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

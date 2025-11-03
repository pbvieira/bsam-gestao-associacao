import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface CategoryStatistic {
  categoria: string;
  total_alunos?: number;
  total_atividades?: number;
  cor: string;
}

export type GroupingMode = 'por_aluno' | 'total_geral';

export function useCategoryStatistics(startDate: Date, endDate: Date, mode: GroupingMode) {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<CategoryStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [user, startDate, endDate, mode]);

  const fetchStatistics = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Primeiro, buscar todas as categorias ativas para ter as cores
      const { data: categories } = await supabase
        .from('annotation_categories')
        .select('nome, cor')
        .eq('ativo', true);

      const categoryColorMap = new Map(
        (categories || []).map(cat => [cat.nome, cat.cor])
      );

      // Buscar anotações no período
      const { data: annotations, error: annotationsError } = await supabase
        .from('student_annotations')
        .select('categoria, student_id')
        .gte('data_evento', startDate.toISOString().split('T')[0])
        .lte('data_evento', endDate.toISOString().split('T')[0])
        .not('categoria', 'is', null);

      if (annotationsError) throw annotationsError;

      // Processar dados baseado no modo
      const statsMap = new Map<string, CategoryStatistic>();

      if (mode === 'por_aluno') {
        // Modo: Por Aluno (contar alunos únicos por categoria)
        annotations?.forEach(annotation => {
          const categoria = annotation.categoria!;
          if (!statsMap.has(categoria)) {
            statsMap.set(categoria, {
              categoria,
              total_alunos: 0,
              cor: categoryColorMap.get(categoria) || '#6366f1'
            });
          }
        });

        // Agora contar alunos únicos por categoria
        for (const [categoria] of statsMap) {
          const uniqueStudents = new Set(
            annotations
              ?.filter(a => a.categoria === categoria)
              .map(a => a.student_id)
          );
          statsMap.get(categoria)!.total_alunos = uniqueStudents.size;
        }
      } else {
        // Modo: Total Geral (contar todas as atividades)
        annotations?.forEach(annotation => {
          const categoria = annotation.categoria!;
          if (!statsMap.has(categoria)) {
            statsMap.set(categoria, {
              categoria,
              total_atividades: 0,
              cor: categoryColorMap.get(categoria) || '#6366f1'
            });
          }
          statsMap.get(categoria)!.total_atividades! += 1;
        });
      }

      // Converter para array e ordenar por total (decrescente)
      const statsArray = Array.from(statsMap.values()).sort((a, b) => {
        const totalA = mode === 'por_aluno' ? (a.total_alunos || 0) : (a.total_atividades || 0);
        const totalB = mode === 'por_aluno' ? (b.total_alunos || 0) : (b.total_atividades || 0);
        return totalB - totalA;
      });

      setStatistics(statsArray);
    } catch (err: any) {
      console.error('Error fetching category statistics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
}

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  message: string;
  code?: string;
  details?: string;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, context?: string) => {
    console.error('Error handled:', error, { context });

    let errorMessage = 'Ocorreu um erro inesperado';
    let errorTitle = 'Erro';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Handle Supabase errors
      const supabaseError = error as PostgrestError;
      if (supabaseError.message) {
        errorMessage = supabaseError.message;
        errorTitle = `Erro ${supabaseError.code || ''}`.trim();
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Customize messages based on context
    if (context) {
      switch (context) {
        case 'auth':
          errorTitle = 'Erro de Autenticação';
          break;
        case 'permissions':
          errorTitle = 'Erro de Permissão';
          break;
        case 'database':
          errorTitle = 'Erro de Banco de Dados';
          break;
        case 'network':
          errorTitle = 'Erro de Conexão';
          errorMessage = 'Verifique sua conexão com a internet e tente novamente';
          break;
      }
    }

    toast({
      variant: 'destructive',
      title: errorTitle,
      description: errorMessage,
    });
  }, [toast]);

  const handleSuccess = useCallback((message: string, title = 'Sucesso') => {
    toast({
      title,
      description: message,
    });
  }, [toast]);

  return {
    handleError,
    handleSuccess,
  };
}
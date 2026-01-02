-- Adicionar colunas area_id e setor_id na tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,
  ADD COLUMN setor_id uuid REFERENCES public.setores(id) ON DELETE SET NULL;

-- Índices para performance nas consultas
CREATE INDEX idx_profiles_area_id ON public.profiles(area_id);
CREATE INDEX idx_profiles_setor_id ON public.profiles(setor_id);
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('aluno', 'auxiliar', 'coordenador', 'diretor');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'aluno',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin users can view all profiles
CREATE POLICY "Directors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('diretor', 'coordenador')
  )
);

-- Create permissions matrix table
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, module, action)
);

-- Enable RLS for permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Only directors can manage permissions
CREATE POLICY "Only directors can manage permissions"
ON public.permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'diretor'
  )
);

-- Insert default permissions
INSERT INTO public.permissions (role, module, action, allowed) VALUES
-- Aluno permissions
('aluno', 'dashboard', 'read', true),
('aluno', 'profile', 'read', true),
('aluno', 'profile', 'update', true),

-- Auxiliar permissions
('auxiliar', 'dashboard', 'read', true),
('auxiliar', 'students', 'read', true),
('auxiliar', 'students', 'create', true),
('auxiliar', 'students', 'update', true),
('auxiliar', 'inventory', 'read', true),
('auxiliar', 'inventory', 'update', true),

-- Coordenador permissions
('coordenador', 'dashboard', 'read', true),
('coordenador', 'students', 'read', true),
('coordenador', 'students', 'create', true),
('coordenador', 'students', 'update', true),
('coordenador', 'students', 'delete', true),
('coordenador', 'inventory', 'read', true),
('coordenador', 'inventory', 'create', true),
('coordenador', 'inventory', 'update', true),
('coordenador', 'inventory', 'delete', true),
('coordenador', 'reports', 'read', true),
('coordenador', 'users', 'read', true),
('coordenador', 'users', 'create', true),
('coordenador', 'users', 'update', true),

-- Diretor permissions (full access)
('diretor', 'dashboard', 'read', true),
('diretor', 'students', 'read', true),
('diretor', 'students', 'create', true),
('diretor', 'students', 'update', true),
('diretor', 'students', 'delete', true),
('diretor', 'inventory', 'read', true),
('diretor', 'inventory', 'create', true),
('diretor', 'inventory', 'update', true),
('diretor', 'inventory', 'delete', true),
('diretor', 'reports', 'read', true),
('diretor', 'users', 'read', true),
('diretor', 'users', 'create', true),
('diretor', 'users', 'update', true),
('diretor', 'users', 'delete', true),
('diretor', 'permissions', 'read', true),
('diretor', 'permissions', 'update', true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    'aluno'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
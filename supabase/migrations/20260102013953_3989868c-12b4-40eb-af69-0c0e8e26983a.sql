-- Create student_cash_book table (Livro Caixa)
CREATE TABLE public.student_cash_book (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tipo_movimento text NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
  categoria text NOT NULL,
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  data_movimento date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_student_cash_book_student_id ON public.student_cash_book(student_id);
CREATE INDEX idx_student_cash_book_data ON public.student_cash_book(data_movimento);

-- Enable RLS
ALTER TABLE public.student_cash_book ENABLE ROW LEVEL SECURITY;

-- Policy for authorized users to manage cash book
CREATE POLICY "Authorized users can manage student cash book"
  ON public.student_cash_book FOR ALL
  USING (EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_cash_book.student_id 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  ));

-- Policy for viewing cash book
CREATE POLICY "Users can view student cash book"
  ON public.student_cash_book FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_cash_book.student_id 
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
  ));
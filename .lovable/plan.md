

## Plano: Restringir visualização de consultas psicológicas

### Problema
Atualmente, todos os usuários com permissão de acesso ao módulo de alunos podem ver todos os registros do prontuário, incluindo consultas psicológicas. Por questão de privacidade, registros do tipo `consulta_psicologica` devem ser visíveis apenas para quem os criou.

### Solução

**Duas camadas de proteção:**

#### 1. RLS no banco de dados (segurança real)

Substituir a política de SELECT da tabela `student_medical_records` por uma que filtre consultas psicológicas:

```sql
-- Remover política antiga de SELECT
DROP POLICY "Users can view student medical records based on permissions" 
  ON public.student_medical_records;

-- Nova política: consultas psicológicas só visíveis pelo criador
CREATE POLICY "Users can view student medical records based on permissions"
ON public.student_medical_records
FOR SELECT
USING (
  CASE 
    WHEN tipo_atendimento = 'consulta_psicologica' THEN created_by = auth.uid()
    ELSE EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE s.id = student_medical_records.student_id
      AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
    )
  END
);
```

A política ALL (para INSERT/UPDATE/DELETE) também precisa ser ajustada para que apenas o criador possa editar/excluir consultas psicológicas:

```sql
DROP POLICY "Authorized users can manage student medical records"
  ON public.student_medical_records;

CREATE POLICY "Authorized users can manage student medical records"
ON public.student_medical_records
FOR ALL
USING (
  CASE
    WHEN tipo_atendimento = 'consulta_psicologica' THEN created_by = auth.uid()
    ELSE EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE s.id = student_medical_records.student_id
      AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
    )
  END
);
```

#### 2. Indicação visual no frontend

**`src/components/students/tabs/student-health-tab.tsx`**: Adicionar um badge/ícone de cadeado nos registros psicológicos para indicar que são privados e visíveis apenas pelo criador.

**`src/components/students/tabs/medical-record-dialog.tsx`**: Mostrar aviso ao selecionar tipo "Consulta Psicológica" informando que o registro será visível apenas para o criador.

### Resumo
- Registros `consulta_psicologica` ficam visíveis e editáveis **apenas** pelo usuário que os criou (`created_by = auth.uid()`)
- Todos os outros tipos de prontuário mantêm o comportamento atual
- A restrição é aplicada no nível do banco de dados (RLS), garantindo segurança real


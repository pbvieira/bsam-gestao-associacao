-- Inserir dados de teste para verificar se tudo está funcionando
-- Apenas para verificar se as foreign keys e políticas estão corretas

-- Primeiro, verificar se existem perfis ativos
DO $$
DECLARE
    user_count INTEGER;
    test_user_id UUID;
    test_task_id UUID;
BEGIN
    -- Contar usuários ativos
    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE active = true;
    
    IF user_count > 0 THEN
        -- Pegar o primeiro usuário ativo
        SELECT user_id INTO test_user_id FROM public.profiles WHERE active = true LIMIT 1;
        
        -- Inserir uma tarefa de teste
        INSERT INTO public.tasks (
            titulo,
            descricao,
            prioridade,
            status,
            categoria,
            created_by,
            assigned_to,
            estimated_hours,
            data_vencimento
        ) VALUES (
            'Tarefa de Teste - ' || NOW()::TEXT,
            'Esta é uma tarefa de teste para verificar se o sistema está funcionando',
            'media',
            'pendente',
            'Teste',
            test_user_id,
            test_user_id,
            2.0,
            NOW() + INTERVAL '7 days'
        ) RETURNING id INTO test_task_id;
        
        RAISE NOTICE 'Tarefa de teste criada com ID: %', test_task_id;
        
        -- Inserir um evento de teste
        INSERT INTO public.calendar_events (
            titulo,
            descricao,
            tipo,
            data_inicio,
            data_fim,
            all_day,
            created_by,
            location
        ) VALUES (
            'Evento de Teste - ' || NOW()::TEXT,
            'Este é um evento de teste para verificar se o calendário está funcionando',
            'evento',
            NOW() + INTERVAL '1 day',
            NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
            false,
            test_user_id,
            'Sala de Testes'
        );
        
        RAISE NOTICE 'Dados de teste inseridos com sucesso para o usuário: %', test_user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário ativo encontrado. Não foi possível inserir dados de teste.';
    END IF;
END $$;
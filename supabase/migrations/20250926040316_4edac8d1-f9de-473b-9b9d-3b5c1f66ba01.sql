-- Inserir dados de teste para verificar funcionamento

-- Verificar se existem usuários no sistema
DO $$
DECLARE
    user_count INTEGER;
    test_user_id UUID;
    test_task_id UUID;
    test_event_id UUID;
BEGIN
    -- Contar usuários existentes
    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE active = true;
    
    IF user_count > 0 THEN
        -- Pegar o primeiro usuário ativo para testes
        SELECT user_id INTO test_user_id FROM public.profiles WHERE active = true LIMIT 1;
        
        -- Inserir tarefa de teste se não existir
        IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE titulo = 'Tarefa de Teste - Sistema') THEN
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
                'Tarefa de Teste - Sistema',
                'Esta é uma tarefa de teste criada pelo sistema para verificar o funcionamento',
                'media',
                'pendente',
                'Teste',
                test_user_id,
                test_user_id,
                2.0,
                NOW() + INTERVAL '7 days'
            ) RETURNING id INTO test_task_id;
            
            RAISE NOTICE 'Tarefa de teste criada com ID: %', test_task_id;
        END IF;
        
        -- Inserir evento de teste se não existir
        IF NOT EXISTS (SELECT 1 FROM public.calendar_events WHERE titulo = 'Evento de Teste - Sistema') THEN
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
                'Evento de Teste - Sistema',
                'Este é um evento de teste criado pelo sistema',
                'evento',
                NOW() + INTERVAL '1 day',
                NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
                false,
                test_user_id,
                'Sala de Reuniões'
            ) RETURNING id INTO test_event_id;
            
            -- Adicionar o criador como participante
            INSERT INTO public.event_participants (
                event_id,
                user_id,
                status,
                is_organizer
            ) VALUES (
                test_event_id,
                test_user_id,
                'aceito',
                true
            );
            
            RAISE NOTICE 'Evento de teste criado com ID: %', test_event_id;
        END IF;
        
        RAISE NOTICE 'Dados de teste inseridos com sucesso para o usuário: %', test_user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado. Faça login primeiro para criar dados de teste.';
    END IF;
END $$;
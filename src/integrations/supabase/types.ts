export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          all_day: boolean | null
          created_at: string
          created_by: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          location: string | null
          recurrence_end: string | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"] | null
          task_id: string | null
          tipo: Database["public"]["Enums"]["event_type"]
          titulo: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string
          created_by: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          location?: string | null
          recurrence_end?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          task_id?: string | null
          tipo?: Database["public"]["Enums"]["event_type"]
          titulo: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean | null
          created_at?: string
          created_by?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          location?: string | null
          recurrence_end?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          task_id?: string | null
          tipo?: Database["public"]["Enums"]["event_type"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_organizer: boolean | null
          status: Database["public"]["Enums"]["participant_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_organizer?: boolean | null
          status?: Database["public"]["Enums"]["participant_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_organizer?: boolean | null
          status?: Database["public"]["Enums"]["participant_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          created_at: string
          event_id: string
          id: string
          processed: boolean
          reminder_type: string
          scheduled_for: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          processed?: boolean
          reminder_type: string
          scheduled_for: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          processed?: boolean
          reminder_type?: string
          scheduled_for?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          estoque_atual: number | null
          estoque_minimo: number | null
          id: string
          nome: string
          origem: string
          unidade_medida: string | null
          updated_at: string
          valor_unitario: number | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          origem: string
          unidade_medida?: string | null
          updated_at?: string
          valor_unitario?: number | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          origem?: string
          unidade_medida?: string | null
          updated_at?: string
          valor_unitario?: number | null
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string
          data_movimento: string
          id: string
          inventory_item_id: string
          observacoes: string | null
          origem_movimento: string
          quantidade: number
          referencia_id: string | null
          referencia_tipo: string | null
          tipo_movimento: string
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          data_movimento?: string
          id?: string
          inventory_item_id: string
          observacoes?: string | null
          origem_movimento: string
          quantidade: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_movimento: string
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          data_movimento?: string
          id?: string
          inventory_item_id?: string
          observacoes?: string | null
          origem_movimento?: string
          quantidade?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_movimento?: string
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          reminder_15min: boolean
          reminder_1h: boolean
          reminder_at_time: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          reminder_15min?: boolean
          reminder_1h?: boolean
          reminder_at_time?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          reminder_15min?: boolean
          reminder_1h?: boolean
          reminder_at_time?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          reference_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          reference_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          reference_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          allowed: boolean
          created_at: string
          id: string
          module: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          action: string
          allowed?: boolean
          created_at?: string
          id?: string
          module: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          action?: string
          allowed?: boolean
          created_at?: string
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          inventory_item_id: string | null
          nome_item: string
          purchase_order_id: string
          quantidade: number
          quantidade_recebida: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          inventory_item_id?: string | null
          nome_item: string
          purchase_order_id: string
          quantidade: number
          quantidade_recebida?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          inventory_item_id?: string | null
          nome_item?: string
          purchase_order_id?: string
          quantidade?: number
          quantidade_recebida?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_by: string | null
          codigo_pedido: string
          created_at: string
          created_by: string
          data_aprovacao: string | null
          data_pedido: string
          data_recebimento: string | null
          id: string
          observacoes: string | null
          received_by: string | null
          status: string
          supplier_id: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          approved_by?: string | null
          codigo_pedido?: string
          created_at?: string
          created_by: string
          data_aprovacao?: string | null
          data_pedido?: string
          data_recebimento?: string | null
          id?: string
          observacoes?: string | null
          received_by?: string | null
          status?: string
          supplier_id: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          approved_by?: string | null
          codigo_pedido?: string
          created_at?: string
          created_by?: string
          data_aprovacao?: string | null
          data_pedido?: string
          data_recebimento?: string | null
          id?: string
          observacoes?: string | null
          received_by?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_annotations: {
        Row: {
          categoria: string | null
          created_at: string
          created_by: string
          data_agendamento: string | null
          data_evento: string
          descricao: string
          id: string
          observacoes: string | null
          student_id: string
          tipo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          created_by: string
          data_agendamento?: string | null
          data_evento?: string
          descricao: string
          id?: string
          observacoes?: string | null
          student_id: string
          tipo: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          created_by?: string
          data_agendamento?: string | null
          data_evento?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          student_id?: string
          tipo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_annotations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_basic_data: {
        Row: {
          bairro: string | null
          batizado: boolean | null
          cartao_sus: string | null
          cep: string | null
          cidade: string | null
          cidade_nascimento: string | null
          comarca_juridica: string | null
          created_at: string
          data_nascimento_conjuge: string | null
          data_nascimento_mae: string | null
          data_nascimento_pai: string | null
          endereco: string | null
          escolaridade: string | null
          estado: string | null
          estado_civil: string | null
          estado_conjuge: string | null
          estado_mae: string | null
          estado_nascimento: string | null
          estado_pai: string | null
          id: string
          nome_conjuge: string | null
          nome_mae: string | null
          nome_pai: string | null
          numero: string | null
          observacoes_juridicas: string | null
          pis_nis: string | null
          religiao: string | null
          situacao_moradia: string | null
          student_id: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          batizado?: boolean | null
          cartao_sus?: string | null
          cep?: string | null
          cidade?: string | null
          cidade_nascimento?: string | null
          comarca_juridica?: string | null
          created_at?: string
          data_nascimento_conjuge?: string | null
          data_nascimento_mae?: string | null
          data_nascimento_pai?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado?: string | null
          estado_civil?: string | null
          estado_conjuge?: string | null
          estado_mae?: string | null
          estado_nascimento?: string | null
          estado_pai?: string | null
          id?: string
          nome_conjuge?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          observacoes_juridicas?: string | null
          pis_nis?: string | null
          religiao?: string | null
          situacao_moradia?: string | null
          student_id: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          batizado?: boolean | null
          cartao_sus?: string | null
          cep?: string | null
          cidade?: string | null
          cidade_nascimento?: string | null
          comarca_juridica?: string | null
          created_at?: string
          data_nascimento_conjuge?: string | null
          data_nascimento_mae?: string | null
          data_nascimento_pai?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado?: string | null
          estado_civil?: string | null
          estado_conjuge?: string | null
          estado_mae?: string | null
          estado_nascimento?: string | null
          estado_pai?: string | null
          id?: string
          nome_conjuge?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          observacoes_juridicas?: string | null
          pis_nis?: string | null
          religiao?: string | null
          situacao_moradia?: string | null
          student_id?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_basic_data_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_children: {
        Row: {
          convive_filhos: boolean | null
          created_at: string
          id: string
          quantidade_filhos: number | null
          student_id: string
          tem_filhos: boolean | null
          updated_at: string
        }
        Insert: {
          convive_filhos?: boolean | null
          created_at?: string
          id?: string
          quantidade_filhos?: number | null
          student_id: string
          tem_filhos?: boolean | null
          updated_at?: string
        }
        Update: {
          convive_filhos?: boolean | null
          created_at?: string
          id?: string
          quantidade_filhos?: number | null
          student_id?: string
          tem_filhos?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_children_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_children_list: {
        Row: {
          created_at: string
          data_nascimento: string
          id: string
          nome_completo: string
          student_children_id: string
        }
        Insert: {
          created_at?: string
          data_nascimento: string
          id?: string
          nome_completo: string
          student_children_id: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string
          id?: string
          nome_completo?: string
          student_children_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_children_list_student_children_id_fkey"
            columns: ["student_children_id"]
            isOneToOne: false
            referencedRelation: "student_children"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          caminho_arquivo: string
          created_at: string
          id: string
          mime_type: string | null
          nome_arquivo: string
          student_id: string
          tamanho_arquivo: number | null
          tipo_documento: string
          uploaded_by: string
        }
        Insert: {
          caminho_arquivo: string
          created_at?: string
          id?: string
          mime_type?: string | null
          nome_arquivo: string
          student_id: string
          tamanho_arquivo?: number | null
          tipo_documento: string
          uploaded_by: string
        }
        Update: {
          caminho_arquivo?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          nome_arquivo?: string
          student_id?: string
          tamanho_arquivo?: number | null
          tipo_documento?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_emergency_contacts: {
        Row: {
          avisar_contato: boolean | null
          created_at: string
          endereco: string | null
          id: string
          nome: string
          parentesco: string | null
          student_id: string
          telefone: string
          updated_at: string
        }
        Insert: {
          avisar_contato?: boolean | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          parentesco?: string | null
          student_id: string
          telefone: string
          updated_at?: string
        }
        Update: {
          avisar_contato?: boolean | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          parentesco?: string | null
          student_id?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_emergency_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_health_data: {
        Row: {
          acompanhamento_psicologico: boolean | null
          alucinacoes: boolean | null
          created_at: string
          data_teste_covid: string | null
          data_teste_ist: string | null
          dependencia_quimica_familia: boolean | null
          descricao_medicamentos: string | null
          detalhes_acompanhamento: string | null
          detalhes_dependencia_familia: string | null
          historico_internacoes: string | null
          historico_surtos: boolean | null
          id: string
          modo_uso_medicamentos: string | null
          observacoes_gerais: string | null
          observacoes_odontologicas: string | null
          resultado_covid: string | null
          resultado_ist: string | null
          student_id: string
          tem_deficiencia: boolean | null
          tempo_uso_medicamentos: string | null
          tentativa_suicidio: boolean | null
          teste_covid: string | null
          teste_ist: string | null
          tipo_deficiencia: string | null
          tratamento_odontologico: boolean | null
          updated_at: string
          uso_medicamentos: boolean | null
          vacinacao_atualizada: boolean | null
        }
        Insert: {
          acompanhamento_psicologico?: boolean | null
          alucinacoes?: boolean | null
          created_at?: string
          data_teste_covid?: string | null
          data_teste_ist?: string | null
          dependencia_quimica_familia?: boolean | null
          descricao_medicamentos?: string | null
          detalhes_acompanhamento?: string | null
          detalhes_dependencia_familia?: string | null
          historico_internacoes?: string | null
          historico_surtos?: boolean | null
          id?: string
          modo_uso_medicamentos?: string | null
          observacoes_gerais?: string | null
          observacoes_odontologicas?: string | null
          resultado_covid?: string | null
          resultado_ist?: string | null
          student_id: string
          tem_deficiencia?: boolean | null
          tempo_uso_medicamentos?: string | null
          tentativa_suicidio?: boolean | null
          teste_covid?: string | null
          teste_ist?: string | null
          tipo_deficiencia?: string | null
          tratamento_odontologico?: boolean | null
          updated_at?: string
          uso_medicamentos?: boolean | null
          vacinacao_atualizada?: boolean | null
        }
        Update: {
          acompanhamento_psicologico?: boolean | null
          alucinacoes?: boolean | null
          created_at?: string
          data_teste_covid?: string | null
          data_teste_ist?: string | null
          dependencia_quimica_familia?: boolean | null
          descricao_medicamentos?: string | null
          detalhes_acompanhamento?: string | null
          detalhes_dependencia_familia?: string | null
          historico_internacoes?: string | null
          historico_surtos?: boolean | null
          id?: string
          modo_uso_medicamentos?: string | null
          observacoes_gerais?: string | null
          observacoes_odontologicas?: string | null
          resultado_covid?: string | null
          resultado_ist?: string | null
          student_id?: string
          tem_deficiencia?: boolean | null
          tempo_uso_medicamentos?: string | null
          tentativa_suicidio?: boolean | null
          teste_covid?: string | null
          teste_ist?: string | null
          tipo_deficiencia?: string | null
          tratamento_odontologico?: boolean | null
          updated_at?: string
          uso_medicamentos?: boolean | null
          vacinacao_atualizada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "student_health_data_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_work_situation: {
        Row: {
          contato_empresa: string | null
          created_at: string
          data_admissao: string | null
          empresa: string | null
          funcao: string | null
          id: string
          profissao: string | null
          renda_per_capita: number | null
          situacao_trabalhista: string | null
          student_id: string
          tipo_renda: string | null
          updated_at: string
          valor_renda: number | null
        }
        Insert: {
          contato_empresa?: string | null
          created_at?: string
          data_admissao?: string | null
          empresa?: string | null
          funcao?: string | null
          id?: string
          profissao?: string | null
          renda_per_capita?: number | null
          situacao_trabalhista?: string | null
          student_id: string
          tipo_renda?: string | null
          updated_at?: string
          valor_renda?: number | null
        }
        Update: {
          contato_empresa?: string | null
          created_at?: string
          data_admissao?: string | null
          empresa?: string | null
          funcao?: string | null
          id?: string
          profissao?: string | null
          renda_per_capita?: number | null
          situacao_trabalhista?: string | null
          student_id?: string
          tipo_renda?: string | null
          updated_at?: string
          valor_renda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_work_situation_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          ativo: boolean
          codigo_cadastro: string
          cpf: string | null
          created_at: string
          data_abertura: string
          data_nascimento: string
          data_saida: string | null
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          nome_completo: string
          nome_responsavel: string | null
          numero_interno: string | null
          parentesco_responsavel: string | null
          rg: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          codigo_cadastro?: string
          cpf?: string | null
          created_at?: string
          data_abertura?: string
          data_nascimento: string
          data_saida?: string | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          nome_completo: string
          nome_responsavel?: string | null
          numero_interno?: string | null
          parentesco_responsavel?: string | null
          rg?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          codigo_cadastro?: string
          cpf?: string | null
          created_at?: string
          data_abertura?: string
          data_nascimento?: string
          data_saida?: string | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          nome_completo?: string
          nome_responsavel?: string | null
          numero_interno?: string | null
          parentesco_responsavel?: string | null
          rg?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato_responsavel: string | null
          cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_fantasia: string | null
          observacoes: string | null
          produtos_servicos: string[] | null
          razao_social: string
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_responsavel?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          produtos_servicos?: string[] | null
          razao_social: string
          telefone?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_responsavel?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          produtos_servicos?: string[] | null
          razao_social?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string
          categoria: string | null
          created_at: string
          created_by: string
          data_conclusao: string | null
          data_vencimento: string | null
          descricao: string | null
          estimated_hours: number | null
          id: string
          parent_task_id: string | null
          prioridade: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to: string
          categoria?: string | null
          created_at?: string
          created_by: string
          data_conclusao?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          prioridade?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string
          categoria?: string | null
          created_at?: string
          created_by?: string
          data_conclusao?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          prioridade?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_event: {
        Args: { creator_uuid: string; event_uuid: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_user: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_event_participant: {
        Args: { event_uuid: string }
        Returns: boolean
      }
      process_event_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      event_type: "reuniao" | "atendimento" | "evento" | "lembrete"
      notification_type:
        | "task"
        | "event"
        | "reminder"
        | "mention"
        | "calendar_invite"
        | "calendar_reminder"
        | "calendar_update"
        | "calendar_cancellation"
      participant_status: "pendente" | "aceito" | "recusado"
      recurrence_type: "none" | "daily" | "weekly" | "monthly"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status:
        | "pendente"
        | "em_andamento"
        | "realizada"
        | "cancelada"
        | "transferida"
      user_role: "aluno" | "auxiliar" | "coordenador" | "diretor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_type: ["reuniao", "atendimento", "evento", "lembrete"],
      notification_type: [
        "task",
        "event",
        "reminder",
        "mention",
        "calendar_invite",
        "calendar_reminder",
        "calendar_update",
        "calendar_cancellation",
      ],
      participant_status: ["pendente", "aceito", "recusado"],
      recurrence_type: ["none", "daily", "weekly", "monthly"],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: [
        "pendente",
        "em_andamento",
        "realizada",
        "cancelada",
        "transferida",
      ],
      user_role: ["aluno", "auxiliar", "coordenador", "diretor"],
    },
  },
} as const

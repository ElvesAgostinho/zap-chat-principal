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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cliente_nome: string
          cliente_telefone: string | null
          criado_em: string
          data_hora: string
          duracao_min: number
          id: string
          lead_id: string | null
          loja_id: string
          notas: string | null
          servico: string | null
          status: string
        }
        Insert: {
          cliente_nome: string
          cliente_telefone?: string | null
          criado_em?: string
          data_hora: string
          duracao_min?: number
          id?: string
          lead_id?: string | null
          loja_id: string
          notas?: string | null
          servico?: string | null
          status?: string
        }
        Update: {
          cliente_nome?: string
          cliente_telefone?: string | null
          criado_em?: string
          data_hora?: string
          duracao_min?: number
          id?: string
          lead_id?: string | null
          loja_id?: string
          notas?: string | null
          servico?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          aprovado_por: string | null
          comprovativo_url: string | null
          criado_em: string
          data_aprovacao: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          loja_id: string
          notas: string | null
          plano_id: string
          status: string
        }
        Insert: {
          aprovado_por?: string | null
          comprovativo_url?: string | null
          criado_em?: string
          data_aprovacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          loja_id: string
          notas?: string | null
          plano_id: string
          status?: string
        }
        Update: {
          aprovado_por?: string | null
          comprovativo_url?: string | null
          criado_em?: string
          data_aprovacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          loja_id?: string
          notas?: string | null
          plano_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          conteudo: string | null
          data_envio: string | null
          destinatarios: number | null
          enviados: number | null
          id: string
          loja_id: string
          produto_nome: string | null
          status_publicado: boolean | null
          tipo: string | null
        }
        Insert: {
          conteudo?: string | null
          data_envio?: string | null
          destinatarios?: number | null
          enviados?: number | null
          id?: string
          loja_id: string
          produto_nome?: string | null
          status_publicado?: boolean | null
          tipo?: string | null
        }
        Update: {
          conteudo?: string | null
          data_envio?: string | null
          destinatarios?: number | null
          enviados?: number | null
          id?: string
          loja_id?: string
          produto_nome?: string | null
          status_publicado?: boolean | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_new_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_loja: {
        Row: {
          ativo: boolean
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: string
          loja_id: string
        }
        Insert: {
          ativo?: boolean
          dia_semana: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          loja_id: string
        }
        Update: {
          ativo?: boolean
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          loja_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_loja_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          bot_enabled: boolean | null
          controle_conversa: string | null
          criado_em: string
          email: string | null
          followup_count: number | null
          fonte: string | null
          id: string
          id_thread: string | null
          interesse: string | null
          loja_id: string
          nome: string
          notas: string | null
          precisa_humano: boolean | null
          status: string
          tags: string[] | null
          telefone: string | null
          ultimo_followup: string | null
        }
        Insert: {
          bot_enabled?: boolean | null
          controle_conversa?: string | null
          criado_em?: string
          email?: string | null
          followup_count?: number | null
          fonte?: string | null
          id?: string
          id_thread?: string | null
          interesse?: string | null
          loja_id: string
          nome: string
          notas?: string | null
          precisa_humano?: boolean | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          ultimo_followup?: string | null
        }
        Update: {
          bot_enabled?: boolean | null
          controle_conversa?: string | null
          criado_em?: string
          email?: string | null
          followup_count?: number | null
          fonte?: string | null
          id?: string
          id_thread?: string | null
          interesse?: string | null
          loja_id?: string
          nome?: string
          notas?: string | null
          precisa_humano?: boolean | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          ultimo_followup?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_new_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          bot_ativo: boolean | null
          codigo_unico: string
          criado_em: string
          endereco: string | null
          formas_pagamento: string[] | null
          id: string
          idioma: string | null
          instance_name: string | null
          instance_status: string | null
          linguagem_bot: string | null
          mensagem_boas_vindas: string | null
          nome: string
          owner_user_id: string | null
          telefone: string | null
          zonas_entrega: string[] | null
        }
        Insert: {
          bot_ativo?: boolean | null
          codigo_unico?: string
          criado_em?: string
          endereco?: string | null
          formas_pagamento?: string[] | null
          id?: string
          idioma?: string | null
          instance_name?: string | null
          instance_status?: string | null
          linguagem_bot?: string | null
          mensagem_boas_vindas?: string | null
          nome: string
          owner_user_id?: string | null
          telefone?: string | null
          zonas_entrega?: string[] | null
        }
        Update: {
          bot_ativo?: boolean | null
          codigo_unico?: string
          criado_em?: string
          endereco?: string | null
          formas_pagamento?: string[] | null
          id?: string
          idioma?: string | null
          instance_name?: string | null
          instance_status?: string | null
          linguagem_bot?: string | null
          mensagem_boas_vindas?: string | null
          nome?: string
          owner_user_id?: string | null
          telefone?: string | null
          zonas_entrega?: string[] | null
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          is_bot: boolean | null
          lead_id: string | null
          lead_nome: string | null
          loja_id: string
          media_type: string | null
          media_url: string | null
          respondido_por: string | null
          respondido_por_nome: string | null
          tipo: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          is_bot?: boolean | null
          lead_id?: string | null
          lead_nome?: string | null
          loja_id: string
          media_type?: string | null
          media_url?: string | null
          respondido_por?: string | null
          respondido_por_nome?: string | null
          tipo?: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          is_bot?: boolean | null
          lead_id?: string | null
          lead_nome?: string | null
          loja_id?: string
          media_type?: string | null
          media_url?: string | null
          respondido_por?: string | null
          respondido_por_nome?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean | null
          criado_em: string
          id: string
          modulos: string[] | null
          nome: string
          preco: number
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string
          id?: string
          modulos?: string[] | null
          nome: string
          preco?: number
          slug: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string
          id?: string
          modulos?: string[] | null
          nome?: string
          preco?: number
          slug?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          criado_em: string
          descricao: string | null
          estoque: number | null
          id: string
          imagem: string | null
          loja_id: string
          nome: string
          preco: number | null
        }
        Insert: {
          criado_em?: string
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem?: string | null
          loja_id: string
          nome: string
          preco?: number | null
        }
        Update: {
          criado_em?: string
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem?: string | null
          loja_id?: string
          nome?: string
          preco?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          criado_em: string
          email: string | null
          id: string
          nome: string | null
          user_id: string
        }
        Insert: {
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string | null
          user_id: string
        }
        Update: {
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usuarios_loja: {
        Row: {
          criado_em: string
          id: string
          loja_id: string
          nome: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          loja_id: string
          nome?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          loja_id?: string
          nome?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_loja_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente_endereco: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          criado_em: string
          data_entregue: string | null
          entregador: string | null
          funcionario_id: string | null
          id: string
          lead_id: string | null
          loja_id: string
          observacoes: string | null
          pagamento_status: string | null
          produto: string | null
          produto_imagem: string | null
          quantidade: number | null
          status: string
          status_entrega: string | null
          valor: number | null
        }
        Insert: {
          cliente_endereco?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          criado_em?: string
          data_entregue?: string | null
          entregador?: string | null
          funcionario_id?: string | null
          id?: string
          lead_id?: string | null
          loja_id: string
          observacoes?: string | null
          pagamento_status?: string | null
          produto?: string | null
          produto_imagem?: string | null
          quantidade?: number | null
          status?: string
          status_entrega?: string | null
          valor?: number | null
        }
        Update: {
          cliente_endereco?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          criado_em?: string
          data_entregue?: string | null
          entregador?: string | null
          funcionario_id?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string
          observacoes?: string | null
          pagamento_status?: string | null
          produto?: string | null
          produto_imagem?: string | null
          quantidade?: number | null
          status?: string
          status_entrega?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_loja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_store_code: { Args: never; Returns: string }
      get_my_membership: {
        Args: never
        Returns: {
          loja_id: string
          nome: string
          role: string
          status: string
        }[]
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      get_user_store_id: { Args: { _user_id: string }; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

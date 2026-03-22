export interface Produto {
  id: string;
  loja_id: string;
  nome: string;
  preco: number;
  imagem: string | null;
  estoque: number;
  descricao: string | null;
  categoria?: string | null;
  atributos?: Record<string, any> | null;
  criado_em: string;
}

export interface Lead {
  id: string;
  loja_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  status: string;
  fonte: string;
  interesse: string | null;
  notas: string | null;
  tags: string[];
  controle_conversa: string;
  precisa_humano: boolean;
  bot_enabled: boolean;
  foto_url?: string | null;
  criado_em: string;
}

export interface Venda {
  id: string;
  lead_id: string | null;
  loja_id: string;
  funcionario_id: string | null;
  produto: string | null;
  produto_imagem: string | null;
  valor: number;
  quantidade: number;
  status: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  cliente_endereco: string | null;
  entregador: string | null;
  pagamento_status: string;
  status_entrega: string;
  observacoes: string | null;
  criado_em: string;
}

export interface Mensagem {
  id: string;
  lead_id: string | null;
  lead_nome: string | null;
  loja_id: string;
  conteudo: string;
  tipo: string;
  is_bot: boolean;
  created_at: string;
}

export interface Campanha {
  id: string;
  loja_id: string;
  tipo: string | null;
  conteudo: string | null;
  produto_nome: string | null;
  destinatarios: number;
  enviados: number;
  status_publicado: boolean;
  data_envio: string;
}

export interface UsuarioLoja {
  id: string;
  user_id: string;
  loja_id: string;
  nome: string | null;
  role: string;
  status: string;
  criado_em: string;
}

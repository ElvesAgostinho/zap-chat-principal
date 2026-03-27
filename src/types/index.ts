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
  variacoes?: { cor?: string; tamanho?: string; estoque: number; preco?: number; imagem?: string }[] | null;
  custo_unitario?: number;
  criado_em: string;
}

export interface Lead {
  id: string;
  loja_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  status: 'novo' | 'Aguardando' | 'Em Atendimento' | 'Fechado' | 'Perdido' | string;
  fonte: string;
  interesse: string | null;
  notas: string | null;
  tags: string[];
  controle_conversa: string;
  precisa_humano: boolean;
  bot_enabled: boolean;
  foto_url?: string | null;
  atendente_id?: string | null;
  segmento?: string | null;
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
  status: 'pendente' | 'pago' | 'cancelado' | 'enviado' | 'entregue' | string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  cliente_endereco: string | null;
  entregador: string | null;
  pagamento_status: 'pendente' | 'pago' | string;
  status_entrega: 'pendente' | 'enviado' | 'entregue' | string;
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
  role: 'admin' | 'funcionario' | 'super_admin' | string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'eliminado' | string;
  criado_em: string;
}

export type Tab = 'dashboard' | 'orders' | 'chat' | 'clients' | 'products' | 'campaigns' | 'alerts' | 'settings' | 'admin' | 'schedule' | 'pipeline' | 'stock' | 'automation' | 'delivery';

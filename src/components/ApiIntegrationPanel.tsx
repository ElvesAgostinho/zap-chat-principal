import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Trash2, Copy, CheckCircle, Code, Webhook, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  nome: string;
  chave: string;
  escopos: string[];
  criado_em: string;
  ultimo_uso: string | null;
}

export default function ApiIntegrationPanel() {
  const { storeId } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    if (!storeId) return;
    const { data, error } = await (supabase as any)
      .from('api_keys')
      .select('*')
      .eq('loja_id', storeId)
      .eq('status', 'ativo')
      .order('criado_em', { ascending: false });
    
    if (error) toast.error('Erro ao buscar chaves');
    else setKeys(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, [storeId]);

  const generateKey = async () => {
    if (!newKeyName || !storeId) return;
    
    const randomChave = 'vzap_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const { error } = await (supabase as any).from('api_keys').insert({
      loja_id: storeId,
      nome: newKeyName,
      chave: randomChave,
      escopos: ['all']
    });

    if (error) {
      toast.error('Erro ao gerar chave');
    } else {
      setGeneratedKey(randomChave);
      setNewKeyName('');
      fetchKeys();
      toast.success('Chave API gerada com sucesso!');
    }
  };

  const revokeKey = async (id: string) => {
    const { error } = await (supabase as any)
      .from('api_keys')
      .update({ status: 'revogado' })
      .eq('id', id);

    if (error) toast.error('Erro ao revogar chave');
    else {
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Chave revogada');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-6 rounded-3xl border border-indigo-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-glow">
            <Webhook className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">Hub de Integrações</h2>
            <p className="text-xs text-muted-foreground font-medium">Conecte o CRM Zap com n8n, Zapier ou seu próprio sistema.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nome da integração (ex: n8n Workflow)" 
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            className="flex-1 bg-white border border-border px-4 py-3 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <button 
            onClick={generateKey}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow"
          >
            Gerar Chave
          </button>
        </div>
      </div>

      {generatedKey && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3"
        >
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Sua Nova Chave API</span>
          </div>
          <p className="text-[10px] text-emerald-600">Copie agora, você não poderá vê-la novamente por segurança.</p>
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100 group">
            <code className="text-sm font-mono text-emerald-700 break-all">{generatedKey}</code>
            <button 
              onClick={() => { navigator.clipboard.writeText(generatedKey); toast.success('Copiado!'); }}
              className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
          <button 
            onClick={() => setGeneratedKey(null)}
            className="text-[10px] font-bold text-emerald-700 underline"
          >
            Já salvei minha chave
          </button>
        </motion.div>
      )}

      <div className="space-y-3">
        <h3 className="text-metadata flex items-center gap-2 px-1 text-muted-foreground font-bold">
          <Key className="w-3.5 h-3.5" /> Chaves Ativas
        </h3>
        
        {loading ? (
          <div className="p-12 text-center text-muted-foreground"><Code className="w-8 h-8 mx-auto mb-2 animate-pulse" /> Carregando...</div>
        ) : keys.length === 0 ? (
          <div className="bg-card p-10 rounded-3xl border border-dashed border-border text-center">
            <p className="text-sm text-muted-foreground">Nenhuma chave gerada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keys.map(k => (
              <div key={k.id} className="bg-card p-5 rounded-2xl border border-border shadow-card flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-foreground">{k.nome}</h4>
                    <button 
                      onClick={() => revokeKey(k.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">all scopes</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">Ativa</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Criada em: {new Date(k.criado_em).toLocaleDateString()}</span>
                  <span>Uso: {k.ultimo_uso ? new Date(k.ultimo_uso).toLocaleDateString() : 'Nunca'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Docs Snippet */}
      <div className="bg-secondary/40 p-6 rounded-3xl border border-border/50 space-y-4">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <Info className="w-4 h-4 text-primary" />
          Como Integrar?
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Para enviar dados do CRM para outras plataformas, use nossa chave API no cabeçalho das suas requisições:
        </p>
        <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
          <pre className="text-[10px] text-slate-300 font-mono">
{`curl -X GET "https://api.crmzap.ao/v1/vendas" \\
  -H "Authorization: Bearer VZAP_SUA_CHAVE_AQUI" \\
  -H "Content-Type: application/json"`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Consulte nossa <span className="text-primary underline cursor-pointer">documentação completa</span> para ver todos os endpoints disponíveis.
        </p>
      </div>
    </div>
  );
}

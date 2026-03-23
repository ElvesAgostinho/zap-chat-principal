import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Landmark, Save, RefreshCw } from 'lucide-react';

export default function PlatformBillingConfig() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    bank_name: '',
    account_name: '',
    iban: '',
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('platform_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setConfig(data);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('platform_config')
        .upsert({ id: 1, ...config });

      if (error) throw error;
      toast({ title: 'Definições Guardadas', description: 'As novas coordenadas bancárias estão agora visíveis para todos os clientes.' });
    } catch (err: any) {
      toast({ title: 'Erro ao guardar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-6 rounded-3xl shadow-card border border-border/50 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Coordenadas Bancárias Mestras</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Visível para clientes ao comprar ou atualizar planos.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome do Banco</label>
          <input
            type="text"
            placeholder="Ex: BAI (Banco Angolano de Investimentos)"
            value={config.bank_name}
            onChange={e => setConfig(prev => ({ ...prev, bank_name: e.target.value }))}
            className="w-full bg-background border border-border rounded-xl px-4 h-11 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome da Conta (Titular)</label>
          <input
            type="text"
            placeholder="Ex: ZAP VENDAS TECNOLOGIA"
            value={config.account_name}
            onChange={e => setConfig(prev => ({ ...prev, account_name: e.target.value }))}
            className="w-full bg-background border border-border rounded-xl px-4 h-11 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IBAN</label>
          <input
            type="text"
            placeholder="AO06..."
            value={config.iban}
            onChange={e => setConfig(prev => ({ ...prev, iban: e.target.value }))}
            className="w-full bg-background border border-border rounded-xl px-4 h-11 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !config.bank_name.trim() || !config.account_name.trim() || !config.iban.trim()}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar Coordenadas'}
          </button>
          
          <button
            onClick={fetchConfig}
            disabled={saving}
            className="flex items-center justify-center sm:w-11 gap-2 h-11 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 transition-all"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="sm:hidden">Recarregar</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

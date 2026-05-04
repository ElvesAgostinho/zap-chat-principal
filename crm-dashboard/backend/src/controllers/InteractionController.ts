import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const InteractionController = {
    async handleEvolutionWebhook(req: Request, res: Response) {
        try {
            const { event, data } = req.body;

            // Apenas processamos mensagens recebidas ou enviadas
            if (event !== 'messages.upsert') {
                return res.status(200).json({ status: 'ignored' });
            }

            const message = data.message;
            const remoteJid = data.key.remoteJid;
            const fromMe = data.key.fromMe;
            const text = message.conversation || message.extendedTextMessage?.text || '';
            const phone = remoteJid.split('@')[0];

            // 1. Localizar o lead pelo telefone
            const { data: lead, error: leadError } = await supabase
                .from('leads')
                .select('id, name')
                .ilike('phone', `%${phone}%`)
                .single();

            if (leadError || !lead) {
                console.log(`Lead não encontrado para o telefone: ${phone}`);
                return res.status(200).json({ status: 'lead_not_found' });
            }

            // 2. Salvar a interação
            const { error: interactionError } = await supabase
                .from('interactions')
                .insert([{
                    lead_id: lead.id,
                    channel: 'whatsapp',
                    content: text,
                    direction: fromMe ? 'outbound' : 'inbound',
                    sentiment: 'neutral' // Pode ser expandido com IA futuramente
                }]);

            if (interactionError) throw interactionError;

            // 3. Lógica de Handover (Se o bot disser que vai transferir)
            if (fromMe && isHandoverMessage(text)) {
                await supabase
                    .from('leads')
                    .update({ status: 'ready_for_human' })
                    .eq('id', lead.id);
                
                console.log(`Lead ${lead.name} marcado para atendimento humano.`);
            }

            return res.status(200).json({ status: 'success' });
        } catch (error: any) {
            console.error('Erro no Webhook Evolution:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }
};

function isHandoverMessage(text: string): boolean {
    const keywords = ['transferir', 'humano', 'consultor', 'atendente', 'Marcela', 'falar com alguém'];
    return keywords.some(key => text.toLowerCase().includes(key.toLowerCase()));
}

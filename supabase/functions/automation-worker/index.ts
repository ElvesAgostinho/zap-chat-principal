import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const baseUrl = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';

  try {
    // 1. Fetch pending automations that are due
    const { data: pendings, error } = await supabase
      .from('automacoes_pendentes')
      .select('*, leads(*), lojas(*), automacoes(*)')
      .eq('status', 'pending')
      .lte('execute_at', new Date().toISOString())
      .limit(10);

    if (error) throw error;
    if (!pendings || pendings.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No pending automations.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    for (const pending of pendings) {
      const store = pending.lojas;
      const lead = pending.leads;
      const auto = pending.automacoes;
      const startNodeId = pending.node_id;

      if (!store || !lead || !auto) {
        await supabase.from('automacoes_pendentes').update({ status: 'cancelled' }).eq('id', pending.id);
        continue;
      }

      const instanceName = store.instance_name;
      const phone = lead.telefone;
      if (!instanceName || !phone) {
        await supabase.from('automacoes_pendentes').update({ status: 'cancelled' }).eq('id', pending.id);
        continue;
      }

      const nodes = Array.isArray(auto.nodes) ? auto.nodes : (Array.isArray(auto.flow_data?.nodes) ? auto.flow_data.nodes : []);
      const edges = Array.isArray(auto.edges) ? auto.edges : (Array.isArray(auto.flow_data?.edges) ? auto.flow_data.edges : []);

      let nextNode = nodes.find((n: any) => n.id === startNodeId);

      // Loop de execução copiado do webhook
      let visitedNodes = new Set();
      let executionSteps = 0;

      while (nextNode) {
        if (visitedNodes.has(nextNode.id) || executionSteps > 50) {
          console.log(`[worker] Loop detetado ou limite excedido (nó ${nextNode.id}). Interrompendo.`);
          break;
        }
        visitedNodes.add(nextNode.id);
        executionSteps++;

        // Replaces text with variables
        const parseVariables = async (text: string, lId: string) => {
          if (!text || !text.includes('{{')) return text;
          const { data: ld } = await supabase.from('leads').select('nome, variaveis').eq('id', lId).single();
          let result = text.replace(/{{nome}}/g, ld?.nome || '');
          if (ld?.variaveis) {
            for (const [key, value] of Object.entries(ld.variaveis)) {
              result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }
          }
          return result;
        };

        if (nextNode.type === 'messageNode') {
          let msgTextRaw = nextNode.data?.label || '';
          if (msgTextRaw) {
            const msgText = await parseVariables(msgTextRaw, lead.id);
            await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
              body: JSON.stringify({ number: phone, text: msgText, options: { delay: 1500, presence: 'composing' } }),
            });
            await supabase.from('mensagens').insert({ lead_id: lead.id, lead_nome: lead.nome, conteudo: msgText, tipo: 'enviada', is_bot: true, loja_id: store.id });
          }
        }
        else if (nextNode.type === 'mediaNode') {
          const mediaUrl = nextNode.data?.mediaUrl;
          if (mediaUrl) {
            const isImage = mediaUrl.match(/\.(jpeg|jpg|gif|png)(\?.*)?$/i);
            const isAudio = mediaUrl.match(/\.(ogg|mp3|wav|m4a|aac)(\?.*)?$/i);
            const isVideo = mediaUrl.match(/\.(mp4|mov|avi|mkv)(\?.*)?$/i);
            
            let mType = 'document';
            if (isImage) mType = 'image';
            else if (isAudio) mType = 'audio';
            else if (isVideo) mType = 'video';

            const options: any = { delay: 1500 };
            if (isAudio) options.presence = 'recording';

              if (isAudio) {
                await fetch(`${baseUrl}/message/sendWhatsAppAudio/${instanceName}`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                  body: JSON.stringify({ number: phone, audio: mediaUrl, delay: 1500, encoding: true }),
                });
              } else {
                await fetch(`${baseUrl}/message/sendMedia/${instanceName}`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                  body: JSON.stringify({ number: phone, mediatype: mType, media: mediaUrl, options }),
                });
              }
            await supabase.from('mensagens').insert({ lead_id: lead.id, lead_nome: lead.nome, conteudo: '[Mídia da Automação]', media_url: mediaUrl, media_type: mType, tipo: 'enviada', is_bot: true, loja_id: store.id });
          }
        }
        else if (nextNode.type === 'actionNode') {
          const actionType = nextNode.data?.actionType || 'add_tag';
          const actionValue = String(nextNode.data?.actionValue || '').trim();
          
          if (actionType === 'add_tag' && actionValue) {
            const { data: leadData } = await supabase.from('leads').select('tags').eq('id', lead.id).single();
            const existingTags = leadData?.tags || [];
            if (!existingTags.includes(actionValue)) {
              await supabase.from('leads').update({ tags: [...existingTags, actionValue] }).eq('id', lead.id);
            }
          } else if (actionType === 'remove_tag' && actionValue) {
            const { data: leadData } = await supabase.from('leads').select('tags').eq('id', lead.id).single();
            const existingTags = leadData?.tags || [];
            const newTags = existingTags.filter((t: string) => t !== actionValue);
            await supabase.from('leads').update({ tags: newTags }).eq('id', lead.id);
          } else if (actionType === 'change_status' && actionValue) {
            await supabase.from('leads').update({ status: actionValue }).eq('id', lead.id);
          }
        }
        else if (nextNode.type === 'conditionNode') {
          const conditionType = nextNode.data?.conditionType;
          const conditionValue = nextNode.data?.conditionValue;
          let conditionMet = false;
          
          const { data: leadData } = await supabase.from('leads').select('tags, telefone, status, variaveis').eq('id', lead.id).single();
          if (conditionType === 'has_tag') {
            conditionMet = (leadData?.tags || []).includes(conditionValue);
          } else if (conditionType === 'no_tag') {
            conditionMet = !(leadData?.tags || []).includes(conditionValue);
          } else if (conditionType === 'phone_exists') {
            conditionMet = !!leadData?.telefone;
          } else if (conditionType === 'has_status') {
            conditionMet = (leadData?.status || '').toLowerCase() === conditionValue.trim().toLowerCase();
          } else if (conditionType === 'not_status') {
            conditionMet = (leadData?.status || '').toLowerCase() !== conditionValue.trim().toLowerCase();
          } else if (conditionType === 'hour_between') {
            const [start, end] = conditionValue.split('-');
            if (start && end) {
              const currentHour = new Date().getHours() + (new Date().getMinutes() / 60);
              const [sH, sM] = start.split(':').map(Number);
              const [eH, eM] = end.split(':').map(Number);
              const sT = sH + (sM || 0)/60;
              const eT = eH + (eM || 0)/60;
              conditionMet = (currentHour >= sT && currentHour <= eT);
            }
          } else if (conditionType === 'day_of_week') {
            const day = new Date().getDay();
            const cDay = Number(conditionValue);
            conditionMet = (day === cDay);
          } else if (conditionType === 'var_equals') {
            const [vName, vVal] = conditionValue.split('=');
            if (vName && vVal && leadData?.variaveis) {
              conditionMet = String(leadData.variaveis[vName.trim()]).toLowerCase() === vVal.trim().toLowerCase();
            }
          }
          // match_exact/match_contains always false in worker since there's no incoming message text.
          
          const trueEdge = edges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('true'));
          const falseEdge = edges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('false'));
          
          let targetEdge = conditionMet ? trueEdge : falseEdge;
          if (!targetEdge) targetEdge = edges.find((e: any) => e.source === nextNode.id);
          
          if (targetEdge) {
            nextNode = nodes.find((n: any) => n.id === targetEdge.target);
            continue; 
          } else {
            nextNode = null;
            break;
          }
        }
        else if (nextNode.type === 'delayNode') {
          const amount = parseInt(nextNode.data?.amount || '1', 10);
          const unit = nextNode.data?.unit || 'minutos';
          
          let delayMs = amount * 60 * 1000;
          if (unit === 'segundos') delayMs = amount * 1000;
          else if (unit === 'horas') delayMs = amount * 60 * 60 * 1000;
          else if (unit === 'dias') delayMs = amount * 24 * 60 * 60 * 1000;

          const executeAt = new Date(Date.now() + delayMs).toISOString();
          const edgeAfterDelay = edges.find((e: any) => e.source === nextNode.id);
          if (edgeAfterDelay) {
            const targetNodeId = edgeAfterDelay.target;
            await supabase.from('automacoes_pendentes').insert({
              lead_id: lead.id,
              loja_id: store.id,
              automacao_id: auto.id,
              node_id: targetNodeId,
              execute_at: executeAt
            });
          }
          break; // Stop and wait for the NEXT worker
        }
        else if (nextNode.type === 'inputNode') {
          const questionRaw = nextNode.data?.label || '';
          if (questionRaw) {
            const question = await parseVariables(questionRaw, lead.id);
            await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
              body: JSON.stringify({ number: phone, text: question, options: { delay: 1500, presence: 'composing' } }),
            });
            await supabase.from('mensagens').insert({ lead_id: lead.id, lead_nome: lead.nome, conteudo: question, tipo: 'enviada', is_bot: true, loja_id: store.id });
            try {
              await supabase.from('automacoes_pendentes').insert({
                lead_id: lead.id, loja_id: store.id, automacao_id: auto.id,
                node_id: nextNode.id, status: 'waiting_input', execute_at: new Date('2099-12-31').toISOString()
              });
            } catch (e) {
              console.warn('[worker] Erro inputNode:', e);
            }
          }
          break; // Stop and wait for user reply
        }
        else if (nextNode.type === 'stopNode') {
          await supabase.from('leads').update({ controle_conversa: 'humano' }).eq('id', lead.id);
          break;
        }
        else if (nextNode.type === 'timerNode') {
          const timeStr = nextNode.data?.time || '09:00';
          const [tH, tM] = timeStr.split(':').map(Number);
          let targetDate = new Date();
          targetDate.setHours(tH, tM, 0, 0);
          if (targetDate <= new Date()) {
            targetDate.setDate(targetDate.getDate() + 1); // Amanhã
          }
          const edgeAfterDelay = edges.find((e: any) => e.source === nextNode.id);
          if (edgeAfterDelay) {
            await supabase.from('automacoes_pendentes').insert({
              lead_id: lead.id, loja_id: store.id, automacao_id: auto.id,
              node_id: edgeAfterDelay.target, execute_at: targetDate.toISOString()
            });
          }
          break;
        }
        else if (nextNode.type === 'notifyNode') {
          const alertMsg = nextNode.data?.label || 'Lead precisa de atenção!';
          await supabase.from('leads').update({ precisa_humano: true }).eq('id', lead.id);
          await supabase.from('mensagens').insert({ lead_id: lead.id, lead_nome: lead.nome, conteudo: `[SISTEMA] 🔔 ${alertMsg}`, tipo: 'enviada', is_bot: true, loja_id: store.id });
        }
        
        // Go to next node
        const edge = edges.find((e: any) => e.source === nextNode.id);
        if (edge) {
          nextNode = nodes.find((n: any) => n.id === edge.target);
        } else {
          nextNode = null;
        }
        await new Promise(r => setTimeout(r, 600)); 
      }

      // Mark this pending task as completed
      await supabase.from('automacoes_pendentes').update({ status: 'completed' }).eq('id', pending.id);
    }

    return new Response(JSON.stringify({ success: true, processed: pendings.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Worker error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

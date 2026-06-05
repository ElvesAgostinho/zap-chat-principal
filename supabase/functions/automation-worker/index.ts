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

  const rawUrl = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/+$/, '');
  const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';

  // Normalize text: remove accents for comparison (handles ç, ã, etc.)
  const normalizeText = (s: string) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  try {
    // Fetch pending automations that are due
    const { data: pendings, error } = await supabase
      .from('automacoes_pendentes')
      .select('*, leads(*), lojas(*), automacoes(*)')
      .eq('status', 'pending')
      .lte('execute_at', new Date().toISOString())
      .limit(10);

    if (error) throw error;
    if (!pendings || pendings.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No pending automations.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

      // Use let so jumpNode can swap context
      let currentNodes: any[] = Array.isArray(auto.nodes) ? auto.nodes : (Array.isArray(auto.flow_data?.nodes) ? auto.flow_data.nodes : []);
      let currentEdges: any[] = Array.isArray(auto.edges) ? auto.edges : (Array.isArray(auto.flow_data?.edges) ? auto.flow_data.edges : []);

      let nextNode = currentNodes.find((n: any) => n.id === startNodeId);
      let visitedNodes = new Set();
      let executionSteps = 0;

      // Helper: replace variables like {{nome}}, {{email}}, etc.
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

      // Helper: get next sequential node
      const getNextNode = (currentId: string, nodes: any[], edges: any[]) => {
        const edgeOut = edges.find((e: any) => e.source === currentId);
        if (edgeOut) return nodes.find((n: any) => n.id === edgeOut.target);
        return null;
      };

      while (nextNode) {
        if (visitedNodes.has(nextNode.id) || executionSteps > 50) {
          console.log(`[worker] Loop detetado ou limite excedido (nó ${nextNode.id}). Interrompendo.`);
          break;
        }
        visitedNodes.add(nextNode.id);
        executionSteps++;

        // ── messageNode ──────────────────────────────────────────────────────
        if (nextNode.type === 'messageNode') {
          const msgTextRaw = nextNode.data?.label || '';
          if (msgTextRaw) {
            const msgText = await parseVariables(msgTextRaw, lead.id);
            await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
              body: JSON.stringify({ number: phone, text: msgText, options: { delay: 1500, presence: 'composing' } }),
            });
            await supabase.from('mensagens').insert({ lead_id: lead.id, lead_nome: lead.nome, conteudo: msgText, tipo: 'enviada', is_bot: true, loja_id: store.id });
          }
        }
        // ── mediaNode ────────────────────────────────────────────────────────
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
        // ── actionNode ───────────────────────────────────────────────────────
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
            await supabase.from('leads').update({ tags: existingTags.filter((t: string) => t !== actionValue) }).eq('id', lead.id);
          } else if (actionType === 'change_status' && actionValue) {
            await supabase.from('leads').update({ status: actionValue }).eq('id', lead.id);
          }
        }
        // ── conditionNode ────────────────────────────────────────────────────
        else if (nextNode.type === 'conditionNode') {
          const conditionType = nextNode.data?.conditionType;
          // conditionValue may be in data.conditionValue (from editor) or data.label (legacy)
          const conditionValue = String(nextNode.data?.conditionValue || nextNode.data?.label || '').trim();
          let conditionMet = false;

          const { data: leadData } = await supabase.from('leads').select('tags, telefone, status, variaveis').eq('id', lead.id).single();

          if (conditionType === 'has_tag') {
            conditionMet = (leadData?.tags || []).includes(conditionValue);
          } else if (conditionType === 'no_tag') {
            conditionMet = !(leadData?.tags || []).includes(conditionValue);
          } else if (conditionType === 'phone_exists') {
            conditionMet = !!leadData?.telefone;
          } else if (conditionType === 'has_status') {
            conditionMet = normalizeText(leadData?.status || '') === normalizeText(conditionValue);
          } else if (conditionType === 'not_status') {
            conditionMet = normalizeText(leadData?.status || '') !== normalizeText(conditionValue);
          } else if (conditionType === 'match_exact') {
            // In the worker there's no incoming message text — always false
            conditionMet = false;
          } else if (conditionType === 'match_contains') {
            conditionMet = false;
          } else if (conditionType === 'hour_between') {
            const [start, end] = conditionValue.split('-');
            if (start && end) {
              const currentHour = new Date().getHours() + (new Date().getMinutes() / 60);
              const [sH, sM] = start.split(':').map(Number);
              const [eH, eM] = end.split(':').map(Number);
              const sT = sH + (sM || 0) / 60;
              const eT = eH + (eM || 0) / 60;
              conditionMet = currentHour >= sT && currentHour <= eT;
            }
          } else if (conditionType === 'day_of_week') {
            const day = new Date().getDay(); // 0-6 (Sun-Sat)
            conditionMet = day === Number(conditionValue);
          } else if (conditionType === 'var_equals') {
            // Format expected: "varName=value"
            const [vName, vVal] = conditionValue.split('=');
            if (vName && vVal && leadData?.variaveis) {
              conditionMet = normalizeText(String(leadData.variaveis[vName.trim()])) === normalizeText(vVal);
            }
          }

          const trueEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('true'));
          const falseEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('false'));
          const targetEdge = conditionMet ? trueEdge : falseEdge;
          console.log(`[worker] conditionNode [${conditionType}="${conditionValue}"] met=${conditionMet} → ${conditionMet ? 'SIM' : 'NÃO'}`);

          nextNode = targetEdge ? currentNodes.find((n: any) => n.id === targetEdge.target) : null;
          continue; // CRITICAL: always continue — do NOT fall through to getNextNode
        }
        // ── delayNode ────────────────────────────────────────────────────────
        else if (nextNode.type === 'delayNode') {
          const amount = parseInt(nextNode.data?.amount || '1', 10);
          const unit = nextNode.data?.unit || 'minutos';
          let delayMs = amount * 60 * 1000;
          if (unit === 'segundos') delayMs = amount * 1000;
          else if (unit === 'horas') delayMs = amount * 60 * 60 * 1000;
          else if (unit === 'dias') delayMs = amount * 24 * 60 * 60 * 1000;
          const executeAt = new Date(Date.now() + delayMs).toISOString();
          const edgeAfterDelay = currentEdges.find((e: any) => e.source === nextNode.id);
          if (edgeAfterDelay) {
            await supabase.from('automacoes_pendentes').insert({
              lead_id: lead.id, loja_id: store.id, automacao_id: auto.id,
              node_id: edgeAfterDelay.target, execute_at: executeAt,
            });
            console.log(`[worker] Delay de ${amount} ${unit}. Agendado para ${executeAt}.`);
          }
          break; // Stop and wait for next worker run
        }
        // ── inputNode ────────────────────────────────────────────────────────
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
                node_id: nextNode.id, status: 'waiting_input', 
                execute_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h timeout
              });
            } catch (e) {
              console.warn('[worker] Erro ao guardar estado de input:', e);
            }
          }
          break; // Stop and wait for user reply
        }
        // ── stopNode ─────────────────────────────────────────────────────────
        else if (nextNode.type === 'stopNode') {
          const stopMode = nextNode.data?.stopMode || 'stop_flow';
          if (stopMode === 'transfer_human') {
            console.log(`[worker] stopNode: Transferindo para humano.`);
            await supabase.from('leads').update({ controle_conversa: 'humano', precisa_humano: true }).eq('id', lead.id);
          } else {
            console.log(`[worker] stopNode: Parando automação.`);
          }
          break;
        }
        // ── timerNode ────────────────────────────────────────────────────────
        else if (nextNode.type === 'timerNode') {
          const timeStr = nextNode.data?.time || '09:00';
          const [tH, tM] = timeStr.split(':').map(Number);
          let targetDate = new Date();
          targetDate.setHours(tH, tM, 0, 0);
          if (targetDate <= new Date()) targetDate.setDate(targetDate.getDate() + 1);
          const edgeAfterTimer = currentEdges.find((e: any) => e.source === nextNode.id);
          if (edgeAfterTimer) {
            await supabase.from('automacoes_pendentes').insert({
              lead_id: lead.id, loja_id: store.id, automacao_id: auto.id,
              node_id: edgeAfterTimer.target, execute_at: targetDate.toISOString(),
            });
            console.log(`[worker] timerNode agendou para ${targetDate.toISOString()}`);
          }
          break;
        }
        // ── notifyNode ───────────────────────────────────────────────────────
        else if (nextNode.type === 'notifyNode') {
          const alertMsg = nextNode.data?.label || 'Lead precisa de atenção!';
          await supabase.from('leads').update({ precisa_humano: true }).eq('id', lead.id);
          await supabase.from('mensagens').insert({ lead_id: lead.id, lead_nome: lead.nome, conteudo: `[SISTEMA] [ALERTA] ${alertMsg}`, tipo: 'enviada', is_bot: true, loja_id: store.id });
          console.log(`[worker] notifyNode: Alerta criado para lead ${lead.id}`);
        }
        // ── randomizerNode ───────────────────────────────────────────────────
        else if (nextNode.type === 'randomizerNode') {
          const splitA = parseInt(nextNode.data?.splitA || '50', 10);
          const usePathA = Math.random() * 100 < splitA;
          const edgeA = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).toLowerCase().includes('a'));
          const edgeB = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).toLowerCase().includes('b'));
          const targetEdge = usePathA ? edgeA : edgeB;
          const fallbackEdge = targetEdge || currentEdges.find((e: any) => e.source === nextNode.id);
          console.log(`[worker] randomizerNode: Caminho ${usePathA ? 'A' : 'B'} selecionado.`);
          nextNode = fallbackEdge ? currentNodes.find((n: any) => n.id === fallbackEdge.target) : null;
          continue;
        }
        // ── webhookNode ──────────────────────────────────────────────────────
        else if (nextNode.type === 'webhookNode') {
          const webhookUrl = nextNode.data?.url || '';
          const method = nextNode.data?.method || 'POST';
          if (webhookUrl) {
            try {
              const { data: leadPayload } = await supabase.from('leads').select('nome, telefone, tags, status, interesse').eq('id', lead.id).single();
              const payload = { lead_id: lead.id, store_id: store.id, phone, lead: leadPayload || {}, timestamp: new Date().toISOString() };
              const res = await fetch(webhookUrl, {
                method, headers: { 'Content-Type': 'application/json' },
                body: method === 'POST' ? JSON.stringify(payload) : undefined,
                signal: AbortSignal.timeout(8000),
              });
              console.log(`[worker] webhookNode: ${method} ${webhookUrl} → ${res.status}`);
              const successEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('success'));
              const errorEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('error'));
              const fallbackEdge = (res.ok ? successEdge : errorEdge) || currentEdges.find((e: any) => e.source === nextNode.id);
              nextNode = fallbackEdge ? currentNodes.find((n: any) => n.id === fallbackEdge.target) : null;
              continue;
            } catch (e) {
              console.error('[worker] webhookNode HTTP error:', e);
              const errorEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('error')) || currentEdges.find((e: any) => e.source === nextNode.id);
              nextNode = errorEdge ? currentNodes.find((n: any) => n.id === errorEdge.target) : null;
              continue;
            }
          }
        }
        // ── jumpNode ─────────────────────────────────────────────────────────
        else if (nextNode.type === 'jumpNode') {
          const targetFlowName = String(nextNode.data?.flowName || '').trim().toLowerCase();
          if (targetFlowName) {
            const { data: targetFlow } = await supabase.from('automacoes').select('*').eq('loja_id', store.id).eq('ativo', true).ilike('nome', `%${targetFlowName}%`).maybeSingle();
            if (targetFlow && targetFlow.nodes && targetFlow.edges) {
              const jumpTrigger = targetFlow.nodes.find((n: any) => n.type === 'triggerNode');
              if (jumpTrigger) {
                const jumpEdge = targetFlow.edges.find((e: any) => e.source === jumpTrigger.id);
                if (jumpEdge) {
                  // Swap context to the new flow's nodes/edges
                  currentNodes = targetFlow.nodes;
                  currentEdges = targetFlow.edges;
                  nextNode = currentNodes.find((n: any) => n.id === jumpEdge.target);
                  console.log(`[worker] jumpNode: Redirecionando para fluxo "${targetFlow.nome}"`);
                  continue;
                }
              }
            } else {
              console.warn(`[worker] jumpNode: Fluxo "${targetFlowName}" não encontrado ou inativo.`);
            }
          }
        }

        // Default: advance to next sequential node via edges
        nextNode = getNextNode(nextNode.id, currentNodes, currentEdges);
        await new Promise(r => setTimeout(r, 600)); // Avoid spamming the API
      }

      // Mark this pending task as completed
      await supabase.from('automacoes_pendentes').update({ status: 'completed' }).eq('id', pending.id);
    }

    return new Response(JSON.stringify({ success: true, processed: pendings.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[worker] Erro não tratado:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

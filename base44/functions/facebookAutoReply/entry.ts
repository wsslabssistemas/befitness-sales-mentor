import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  loadConfig,
  getSPHour,
  estimateTokens,
  estimateCredits,
} from '../../shared/automationRules.ts';
import { computeConsumption, summarizeSkips } from '../../shared/automationBudget.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const triggeredBy = 'agendado';

    // 1. Config de automação
    const settings = await base44.asServiceRole.entities.Setting.list();
    const config = loadConfig(settings);

    // 2. Auto-reply só fora do horário comercial (recepcionista assume durante o expediente)
    const hour = getSPHour(new Date());
    const offHours = hour < config.working_window_start || hour >= config.working_window_end;
    if (!offHours) {
      return Response.json({
        mode: 'dentro_horario',
        message: 'Dentro do horário comercial — recepcionista assume o atendimento.',
        hora_sp: hour,
      });
    }

    // 3. Limites: diário + orçamento mensal (compartilhado com proativas)
    const recentLogs = await base44.asServiceRole.entities.AutomationLog.list('-run_date', 50);
    const { monthSpent, budgetReached, consumedToday } = computeConsumption(recentLogs, config);
    let dailyRemaining = Math.max(0, config.max_messages_per_day - consumedToday);
    if (budgetReached) {
      await logRun(base44, { messages_generated: 0, messages_skipped: 0, skip_reasons: 'Orçamento mensal atingido', llm_calls: 0, tokens: 0, credits: 0 });
      return Response.json({ mode: 'bloqueado_orcamento', mes_gasto: monthSpent, orcamento: config.monthly_credit_budget });
    }

    // 4. Token do conector Facebook Pages (conta do builder — modo compartilhado)
    let fbToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('facebook_pages');
      fbToken = conn.accessToken;
    } catch (e) {
      await logRun(base44, { messages_generated: 0, messages_skipped: 0, skip_reasons: 'Conector Facebook não conectado', llm_calls: 0, tokens: 0, credits: 0, status: 'erro', error: e.message });
      return Response.json({ error: 'Conector Facebook não conectado: ' + e.message }, { status: 500 });
    }

    // 5. Lista páginas gerenciadas e seleciona (Setting fb_page_id opcional)
    const pagesRes = await fetch('https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&limit=50', {
      headers: { Authorization: `Bearer ${fbToken}` },
    });
    const pagesJson = await pagesRes.json();
    const pages = pagesJson.data || [];
    if (!pages.length) {
      await logRun(base44, { messages_generated: 0, messages_skipped: 0, skip_reasons: 'Nenhuma página gerenciada', llm_calls: 0, tokens: 0, credits: 0, status: 'erro' });
      return Response.json({ error: 'Nenhuma página do Facebook gerenciada por esta conta.' });
    }
    const fbPageIdSetting = settings.find(s => s.key === 'fb_page_id');
    const page = (fbPageIdSetting && pages.find(p => p.id === fbPageIdSetting.value)) || pages[0];
    const pageToken = page.access_token;

    // 6. Conversas com mensagens não lidas nos últimos 24h (janela do Meta)
    const sinceSec = Math.floor((Date.now() - 24 * 3600 * 1000) / 1000);
    const convRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}/conversations?fields=id,unread_count,updated_time,participants&limit=20`, {
      headers: { Authorization: `Bearer ${pageToken}` },
    });
    const convJson = await convRes.json();
    const conversations = (convJson.data || []).filter(
      c => (c.unread_count || 0) > 0 && new Date(c.updated_time).getTime() / 1000 >= sinceSec
    );

    // Biblioteca de vendas para contexto da IA
    const entries = await base44.asServiceRole.entities.LibraryEntry.list('-created_date', 10);
    const libContext = entries.slice(0, 3).map(e => `- ${e.question || ''}: ${e.answer || ''}`).join('\n') || '(sem biblioteca)';

    // Clientes para match por nome (uma query)
    const customers = await base44.asServiceRole.entities.Customer.list('-created_date', 300);
    const findCustomer = (name) => customers.find(c => (c.name || '').toLowerCase().trim() === (name || '').toLowerCase().trim());

    let replied = 0, skipped = 0, llmCalls = 0, totalTokens = 0;
    const skips = [];

    for (const conv of conversations) {
      if (dailyRemaining <= 0) { skipped++; skips.push({ motivo: 'Limite diário atingido' }); continue; }

      // Última mensagem do cliente na conversa
      const msgRes = await fetch(`https://graph.facebook.com/v25.0/${conv.id}?fields=messages{message,from,created_time,id}&limit=5`, {
        headers: { Authorization: `Bearer ${pageToken}` },
      });
      const msgJson = await msgRes.json();
      const messages = (msgJson.messages && msgJson.messages.data) || [];
      if (!messages.length) { skipped++; skips.push({ motivo: 'Sem mensagens' }); continue; }

      const lastUserMsg = [...messages].reverse().find(m => String(m.from.id) !== String(page.id));
      if (!lastUserMsg) { skipped++; skips.push({ motivo: 'Última mensagem é nossa' }); continue; }

      const psid = String(lastUserMsg.from.id);
      const senderName = lastUserMsg.from.name || 'Cliente Facebook';
      const customerText = lastUserMsg.message || '';

      // Match ou cria Customer
      let customer = findCustomer(senderName);
      if (!customer) {
        customer = await base44.asServiceRole.entities.Customer.create({
          name: senderName,
          lead_source: 'Facebook',
          status: 'novo_contato',
          next_action: 'Responder mensagem no Facebook',
          last_interaction_date: new Date().toISOString(),
        });
        customers.unshift(customer);
      }

      // Dedup: já respondemos este cliente nas últimas 12h? (evita responder 2x a mesma conversa)
      const recentFb = await base44.asServiceRole.entities.Interaction.filter({ customer_id: customer.id }, '-created_date', 5);
      const alreadyReplied = (recentFb || []).some(i =>
        (i.handled_by || '').includes('Facebook') &&
        i.created_date &&
        (Date.now() - new Date(i.created_date).getTime()) < 12 * 3600 * 1000
      );
      if (alreadyReplied) { skipped++; skips.push({ motivo: 'Já respondido recentemente', cliente: senderName }); continue; }

      // Gera resposta via IA
      const prompt = `Você é o Assistente Comercial da academia Be Fitness. Um cliente enviou uma mensagem no Facebook (fora do horário comercial). Gere UMA resposta curta, simpática e humana.

Mensagem do cliente (${senderName}): "${customerText}"

Diretrizes da biblioteca comercial:
${libContext}

REGRAS CRÍTICAS:
- Responda como um consultor da academia: educado, próximo e objetivo.
- O objetivo é abrir caminho para um agendamento de visita/trial.
- Se perguntar preço, seja transparente e convide para a visita (apresente parcelado e à vista se mencionar valor).
- NUNCA use "o que acha?" — use Fechamento Pressuposto ou Alternativa (ofereça 2 horários).
- A academia é FORMATO LIVRE (sem reservas/vagas).
- Curta (até 3 frases), emoji com moderação.
- Se o cliente só cumprimentou ("oi", "olá"), retribua e pergunte o objetivo de forma convidativa.
- Gere APENAS a mensagem de resposta, pronta para enviar.`;

      let replyText;
      try {
        const resp = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: { type: 'object', properties: { mensagem: { type: 'string' } } },
        });
        llmCalls++;
        totalTokens += estimateTokens(prompt) + estimateTokens(resp.mensagem || '');
        replyText = resp.mensagem || 'Olá! Que bom falar com você 💪 Pode me contar qual seu objetivo na academia?';
      } catch (e) {
        skipped++; skips.push({ motivo: 'Erro IA: ' + e.message }); continue;
      }

      // Envia resposta via Send API (janela de 24h)
      const sendRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: psid },
          messaging_type: 'RESPONSE',
          message: { text: replyText },
        }),
      });
      if (!sendRes.ok) {
        const errBody = (await sendRes.text()).slice(0, 140);
        skipped++; skips.push({ motivo: 'Erro envio FB: ' + errBody }); continue;
      }

      // Grava Interaction e atualiza cliente
      await base44.asServiceRole.entities.Interaction.create({
        customer_id: customer.id,
        customer_name: senderName,
        conversation: customerText,
        suggested_response: replyText,
        objective: 'Resposta automática Facebook (off-hours)',
        explanation: 'Auto-reply enviado pelo workflow Facebook',
        techniques: 'Fechamento Pressuposto/Alternativa',
        next_step: 'Aguardar resposta / dar andamento no horário comercial',
        result: 'pendente',
        handled_by: 'Automação Facebook',
        profile_used: 'outro',
      });
      try {
        await base44.asServiceRole.entities.Customer.update(customer.id, { last_interaction_date: new Date().toISOString() });
      } catch (_) { /* não crítico */ }

      replied++;
      dailyRemaining--;
    }

    await logRun(base44, {
      messages_generated: replied,
      messages_skipped: skipped,
      skip_reasons: summarizeSkips(skips),
      llm_calls: llmCalls,
      tokens: totalTokens,
      credits: estimateCredits(llmCalls),
    });

    return Response.json({
      mode: 'automatico',
      pagina: page.name,
      conversas_nao_lidas: conversations.length,
      respostas_enviadas: replied,
      bloqueadas: skipped,
      llm_calls: llmCalls,
      estimated_tokens: totalTokens,
      estimated_credits: estimateCredits(llmCalls),
      bloqueios: skips,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function logRun(base44, { messages_generated, messages_skipped, skip_reasons, llm_calls, tokens, credits, status, error }) {
  try {
    await base44.asServiceRole.entities.AutomationLog.create({
      run_date: new Date().toISOString(),
      mode: 'automatico',
      triggered_by: 'agendado',
      customers_due: messages_generated + messages_skipped,
      messages_generated,
      messages_skipped,
      skip_reasons,
      llm_calls,
      estimated_tokens: tokens,
      estimated_credits: credits,
      status: status || 'ok',
      error: error || '',
    });
  } catch (_) { /* log é best-effort */ }
}
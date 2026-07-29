import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { loadConfig, evaluateSafety } from '../../shared/automationRules.ts';

// Lê as credenciais do WhatsApp do banco (Setting) com fallback para env vars.
async function getWhatsAppConfig(base44) {
  const settings = await base44.asServiceRole.entities.Setting.list();
  const map = {};
  for (const s of settings) map[s.key] = s.value;
  return {
    verifyToken: map.whatsapp_verify_token || Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'befitness_verify_2024',
    token: map.whatsapp_token || Deno.env.get('WHATSAPP_TOKEN') || '',
    phoneNumberId: map.whatsapp_phone_number_id || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '',
    appSecret: map.whatsapp_app_secret || Deno.env.get('WHATSAPP_APP_SECRET') || '',
  };
}

Deno.serve(async (req) => {
  try {
    // GET = verificação do webhook (Meta chama ao cadastrar)
    if (req.method === 'GET') {
      const base44 = createClientFromRequest(req);
      const { verifyToken } = await getWhatsAppConfig(base44);
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token === verifyToken) {
        return new Response(challenge || '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
      return new Response('Forbidden', { status: 403 });
    }

    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // POST = evento do WhatsApp (mensagem recebida ou atualização de status)
    const bodyText = await req.text();

    const base44 = createClientFromRequest(req);
    const waConfig = await getWhatsAppConfig(base44);

    // Validação da assinatura (App Secret) — se configurado
    if (waConfig.appSecret) {
      const sig = req.headers.get('x-hub-signature-256') || '';
      const expected = await hmacSha256(waConfig.appSecret, bodyText);
      if (sig !== `sha256=${expected}`) {
        return Response.json({ error: 'Assinatura inválida' }, { status: 401 });
      }
    }

    const body = JSON.parse(bodyText);
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    // Sem mensagem = atualização de status (lido, entregue) → apenas confirma recebimento
    if (!message) {
      return Response.json({ status: 'ok', type: 'status' });
    }

    const from = message.from; // telefone do cliente
    const text = message.text?.body || '';
    const msgType = message.type;

    // Tipos não-texto (áudio, imagem, botão) — por enquanto não responde automaticamente
    if (msgType !== 'text' || !text) {
      return Response.json({ status: 'ok', type: msgType, skip: true });
    }

    // Busca ou cria o cliente pelo telefone
    const existing = await base44.asServiceRole.entities.Customer.filter({ phone: from });
    let customer = existing[0];
    const contactName = change.value?.contacts?.[0]?.profile?.name || from;
    if (!customer) {
      customer = await base44.asServiceRole.entities.Customer.create({
        name: contactName,
        phone: from,
        lead_source: 'WhatsApp',
        status: 'novo_contato',
      });
    }

    // Regra anti-bloqueio: se o cliente iniciou o contato, respondemos (ignora janela de horário).
    // Mas respeitamos cooldown curto para não duplicar resposta se Meta reenviar o webhook.
    const settings = await base44.asServiceRole.entities.Setting.list();
    const config = loadConfig(settings);
    const interactions = await base44.asServiceRole.entities.Interaction.filter(
      { customer_id: customer.id },
      '-created_date',
      5
    );

    // Dedup simples: se já existe interação com a mesma mensagem nos últimos 2 min, ignora
    const now = Date.now();
    const recentDup = interactions.find(
      (i) => i.conversation === text && i.created_date && now - new Date(i.created_date).getTime() < 120000
    );
    if (recentDup) {
      return Response.json({ status: 'ok', dedup: true });
    }

    // Biblioteca comercial para contextualizar a IA
    const categories = await base44.asServiceRole.entities.LibraryCategory.list();
    const entries = await base44.asServiceRole.entities.LibraryEntry.list();
    const libraryContext = entries
      .slice(0, 25)
      .map((e) => `- Q: ${e.question}\n  R: ${(e.answer || '').slice(0, 180)}`)
      .join('\n');

    const lastInt = interactions[0];
    const lastSuggested = lastInt?.suggested_response || '';

    const prompt = `Você é o Assistente Comercial da academia Be Fitness. Um cliente mandou uma mensagem no WhatsApp e você deve responder automaticamente.

CONTEXTO DO CLIENTE:
- Nome: ${customer.name}
- Status: ${customer.status}
- Perfil: ${customer.profile || 'não informado'}
- Telefone: ${from}

MENSAGEM RECEBIDA DO CLIENTE:
"${text}"

${lastSuggested ? `ÚLTIMA RESPOSTA QUE ENVIAMOS (não repita):\n"${lastSuggested.slice(0, 200)}"` : ''}

BIBLIOTECA COMERCIAL (use como base):
${libraryContext}

REGRAS CRÍTICAS:
- Gere UMA mensagem curta, humana, pronta para enviar no WhatsApp.
- NUNCA use "o que acha?" — use Fechamento Pressuposto ou Alternativa (ofereça duas opções de horário/dia).
- Se o cliente perguntou preço, seja transparente: apresente plano parcelado e à vista, destaque o desconto à vista.
- Se for lead novo, conduza para agendar a semana experimental (ofereça 2 horários).
- Se já é aluno, foque em retenção/relacionamento.
- Use emojis com moderação. Seja simpático e direto.
- A academia é FORMATO LIVRE (sem reservas/vagas).
- Se o cliente nunca foi aluno, NÃO diga "voltar" ou "retornar".

Gere a resposta agora.`;

    let reply = '';
    try {
      const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            mensagem: { type: 'string' },
            tecnica: { type: 'string' },
          },
        },
      });
      reply = response.mensagem || '';
    } catch (e) {
      return Response.json({ error: 'Falha na IA: ' + e.message }, { status: 500 });
    }

    if (!reply) {
      return Response.json({ status: 'ok', skip: 'empty_reply' });
    }

    // Envia via WhatsApp Cloud API
    let sent = false;
    if (waConfig.token && waConfig.phoneNumberId) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${waConfig.phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${waConfig.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: from,
              type: 'text',
              text: { body: reply },
            }),
          }
        );
        sent = res.ok;
      } catch (e) {
        // mesmo se falhar o envio, registramos a interação
      }
    }

    // Registra a interação
    await base44.asServiceRole.entities.Interaction.create({
      customer_id: customer.id,
      customer_name: customer.name,
      conversation: text,
      suggested_response: reply,
      objective: 'Resposta automática (WhatsApp inbound)',
      explanation: 'Gerada pelo webhook do WhatsApp',
      techniques: 'Auto-resposta inbound',
      next_step: 'Aguardar resposta do cliente',
      result: 'pendente',
      handled_by: 'Automação WhatsApp',
      profile_used: customer.profile || 'outro',
    });

    // Atualiza última interação do cliente
    await base44.asServiceRole.entities.Customer.update(customer.id, {
      last_interaction_date: new Date().toISOString(),
    });

    return Response.json({
      status: 'ok',
      cliente: customer.name,
      enviado: sent,
      resposta: reply.slice(0, 200),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function hmacSha256(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
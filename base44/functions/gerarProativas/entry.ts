import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  loadConfig,
  evaluateSafety,
  detectStage,
  estimateTokens,
  estimateCredits,
} from '../../shared/automationRules.ts';
import { computeConsumption, summarizeSkips } from '../../shared/automationBudget.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) { /* defaults */ }
    const triggeredBy = body.triggered_by === 'agendado' ? 'agendado' : 'manual';

    // 1. Carrega configuração (modo + regras anti-bloqueio)
    const settings = await base44.asServiceRole.entities.Setting.list();
    const config = loadConfig(settings);

    // dry_run explícito => força modo simulação (para prévia no dashboard), ignorando o modo off
    const forceSim = body.dry_run === true;

    // Modo off => não gera nada (exceto prévia forçada)
    if (config.auto_mode === 'off' && !forceSim) {
      return Response.json({
        mode: 'off',
        message: 'Automação desligada. Nenhuma mensagem gerada.',
        config,
      });
    }

    // 2. Limite diário já consumido hoje + orçamento mensal (créditos)
    const recentLogs = await base44.asServiceRole.entities.AutomationLog.list('-run_date', 50);
    const { monthSpent, budgetReached, consumedToday } = computeConsumption(recentLogs, config);
    let dailyRemaining = Math.max(0, config.max_messages_per_day - consumedToday);

    // Bloqueio por orçamento: automação suspende até o ciclo reiniciar (virada do mês)
    if (budgetReached && !forceSim) {
      await base44.asServiceRole.entities.AutomationLog.create({
        run_date: new Date().toISOString(),
        mode: 'simulacao',
        triggered_by: triggeredBy,
        customers_due: 0,
        messages_generated: 0,
        messages_skipped: 0,
        skip_reasons: 'Orçamento mensal atingido — automação suspensa até o ciclo reiniciar',
        llm_calls: 0,
        estimated_tokens: 0,
        estimated_credits: 0,
        status: 'ok',
      });
      return Response.json({
        mode: 'bloqueado_orcamento',
        message: 'Orçamento mensal atingido. Automação suspensa até a virada do ciclo (30 dias).',
        mes_gasto: monthSpent,
        orcamento: config.monthly_credit_budget,
        config,
      });
    }

    // 3. Clientes com next_action_date vencida
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = body.limit || 50;
    const customers = await base44.asServiceRole.entities.Customer.list('-next_action_date', 200);
    const due = customers.filter(c => c.next_action_date && new Date(c.next_action_date) <= today).slice(0, limit);

    // 4. Biblioteca "Relacionamento Ativo"
    const categories = await base44.asServiceRole.entities.LibraryCategory.list();
    const relCat = categories.find(c => c.name.toLowerCase().includes('relacionamento'));
    let entries = [];
    if (relCat) {
      entries = await base44.asServiceRole.entities.LibraryEntry.filter({ category_id: relCat.id });
    }
    const findEntry = (kw) => entries.find(e => (e.question || '').toLowerCase().includes(kw));

    const stageToEntry = {
      contato: findEntry('cliente sem matrícula'),
      descoberta: findEntry('cliente sem matrícula'),
      proposta: findEntry('cliente sem matrícula'),
      negociacao: findEntry('cliente sem matrícula'),
      trial: findEntry('cliente matriculado'),
      posvenda: findEntry('cliente matriculado'),
      retencao_30: findEntry('cliente matriculado'),
      retencao_45: findEntry('cliente matriculado'),
      retencao_60: findEntry('cliente matriculado'),
      retencao_90: findEntry('cliente matriculado'),
      reativacao: findEntry('cliente sem matrícula'),
      reativacao_90: findEntry('cliente sem matrícula'),
      reativacao_180: findEntry('cliente sem matrícula'),
      reativacao_365: findEntry('cliente sem matrícula'),
    };

    const tasks = [];
    const skips = [];
    let llmCalls = 0;
    let totalTokens = 0;

    // 5. Para cada cliente devido, avalia segurança e prepara a tarefa
    for (const c of due) {
      // Checagens baratas primeiro (horário + cooldown via last_interaction_date) — evita query desnecessária
      const cheap = evaluateSafety(c, [], config, new Date());
      if (!cheap.canSend) {
        skips.push({ cliente: c.name, motivo: cheap.reason });
        continue;
      }
      // Só busca o histórico se passou das checagens de tempo
      const interactions = await base44.asServiceRole.entities.Interaction.filter({ customer_id: c.id }, '-created_date', 5);
      const safety = evaluateSafety(c, interactions, config, new Date());

      if (!safety.canSend) {
        skips.push({ cliente: c.name, motivo: safety.reason });
        continue;
      }

      const stage = detectStage(c, new Date());
      const entry = stageToEntry[stage] || entries[0];
      if (!entry) {
        skips.push({ cliente: c.name, motivo: 'Régua não encontrada para o estágio' });
        continue;
      }

      const lastInt = interactions[0];
      const lastMessage = lastInt?.suggested_response || '';
      const lastCustomerMsg = lastInt?.conversation || '';
      const lastResult = lastInt?.result || '';

      tasks.push({
        customer_id: c.id,
        customer_name: c.name,
        phone: c.phone || '',
        status: c.status,
        estagio: stage,
        publico: detectPublic(c),
        library_entry_id: entry.id,
        library_question: entry.question,
        base_answer: entry.answer,
        technique: entry.technique || '',
        objective: entry.objective || '',
        ultima_mensagem: lastMessage,
        ultima_msg_cliente: lastCustomerMsg,
        ultimo_resultado: lastResult,
      });
    }

    // 6. Simulação: retorna sem chamar IA nem gravar (mas registra log)
    if (config.auto_mode === 'simulacao' || forceSim) {
      const tokensEst = tasks.reduce((s, t) => s + estimateTokens(t.base_answer || ''), 0);
      await base44.asServiceRole.entities.AutomationLog.create({
        run_date: new Date().toISOString(),
        mode: 'simulacao',
        triggered_by: triggeredBy,
        customers_due: due.length,
        messages_generated: tasks.length,
        messages_skipped: skips.length,
        skip_reasons: summarizeSkips(skips),
        llm_calls: 0,
        estimated_tokens: tokensEst,
        estimated_credits: 0,
        status: 'ok',
      });

      return Response.json({
        mode: 'simulacao',
        data_geracao: today.toISOString().split('T')[0],
        total_clientes_due: due.length,
        total_tarefas: tasks.length,
        bloqueadas: skips.length,
        resumo_por_publico: countByPublic(tasks),
        config,
        tarefas: tasks.map(t => ({
          cliente: t.customer_name,
          telefone: t.phone,
          publico: t.publico,
          estagio: t.estagio,
          status_atual: t.status,
          ultima_mensagem: t.ultima_mensagem ? t.ultima_mensagem.slice(0, 120) : '',
          pergunta_base: t.library_question,
          mensagem_base: t.base_answer,
          tecnica: t.technique,
          objetivo: t.objective,
        })),
        bloqueios: skips,
      });
    }

    // 7. Modo automático: gera via IA, grava Interaction, atualiza cliente
    const generated = [];
    for (const t of tasks) {
      if (dailyRemaining <= 0) {
        skips.push({ cliente: t.customer_name, motivo: 'Limite diário atingido' });
        continue;
      }

      const prompt = buildProactivePrompt(t);
      let response;
      try {
        response = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              mensagem: { type: 'string', description: 'Mensagem pronta para enviar no WhatsApp' },
              tecnica: { type: 'string' },
            },
          },
        });
        llmCalls++;
        totalTokens += estimateTokens(prompt) + estimateTokens(response.mensagem || '');
      } catch (e) {
        skips.push({ cliente: t.customer_name, motivo: 'Erro na IA: ' + e.message });
        continue;
      }

      const mensagem = response.mensagem || t.base_answer;

      // Grava Interaction (pendente — aguarda confirmação de envio/resposta manual)
      await base44.asServiceRole.entities.Interaction.create({
        customer_id: t.customer_id,
        customer_name: t.customer_name,
        conversation: t.ultima_msg_cliente || '(mensagem proativa)',
        suggested_response: mensagem,
        objective: t.objective || '',
        explanation: 'Mensagem proativa gerada automaticamente',
        techniques: response.tecnica || t.technique || '',
        next_step: 'Aguardar resposta do cliente',
        result: 'pendente',
        handled_by: 'Automação',
        profile_used: 'outro',
      });

      // Atualiza cliente: última interação + próxima ação +5 dias
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 5);
      await base44.asServiceRole.entities.Customer.update(t.customer_id, {
        last_interaction_date: new Date().toISOString(),
        next_action: 'Aguardar resposta da mensagem proativa',
        next_action_date: nextDate.toISOString().split('T')[0],
      });

      generated.push({ cliente: t.customer_name, mensagem });
      dailyRemaining--;
    }

    await base44.asServiceRole.entities.AutomationLog.create({
      run_date: new Date().toISOString(),
      mode: 'automatico',
      triggered_by: triggeredBy,
      customers_due: due.length,
      messages_generated: generated.length,
      messages_skipped: skips.length,
      skip_reasons: summarizeSkips(skips),
      llm_calls: llmCalls,
      estimated_tokens: totalTokens,
      estimated_credits: estimateCredits(llmCalls),
      status: 'ok',
    });

    return Response.json({
      mode: 'automatico',
      data_geracao: today.toISOString().split('T')[0],
      total_clientes_due: due.length,
      messages_generated: generated.length,
      messages_skipped: skips.length,
      llm_calls: llmCalls,
      estimated_tokens: totalTokens,
      estimated_credits: estimateCredits(llmCalls),
      bloqueios: skips,
      generated: generated.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function detectPublic(c) {
  const source = (c.lead_source || '').toLowerCase();
  if (source.includes('totalpass') || source.includes('wellhub') || source.includes('convên') || source.includes('conveni')) {
    return 'convenio';
  }
  if (c.status === 'matriculado' || c.status === 'renovado') return 'matriculado';
  return 'sem_matricula';
}

function countByPublic(tasks) {
  const counts = { sem_matricula: 0, convenio: 0, matriculado: 0 };
  for (const t of tasks) counts[t.publico] = (counts[t.publico] || 0) + 1;
  return counts;
}

function buildProactivePrompt(t) {
  const exAluno = t.status === 'matriculado' || t.status === 'renovado' || (t.publico === 'sem_matricula' && false);
  return `Você é o Assistente Comercial da academia Be Fitness. Gere uma mensagem PROATIVA para um cliente (nós iniciamos o contato).

CONTEXTO DA JORNADA:
- Cliente: ${t.customer_name}
- Status atual: ${t.status}
- Estágio: ${t.estagio}
- Público: ${t.publico}

RÉGUA DA BIBLIOTECA (use como base):
- Pergunta: ${t.library_question}
- Resposta base: ${t.base_answer}
- Técnica: ${t.technique}
- Objetivo: ${t.objective}

${t.ultima_mensagem ? `ÚLTIMA MENSAGEM QUE ENVIAMOS a este cliente (NÃO repita a mesma abordagem — evolua a conversa):\n"${t.ultima_mensagem}"` : 'Ainda não enviamos nenhuma mensagem proativa a este cliente.'}

${t.ultima_msg_cliente ? `ÚLTIMA MENSAGEM DO CLIENTE:\n"${t.ultima_msg_cliente}"` : 'O cliente não respondeu à última mensagem.'}

${t.ultimo_resultado ? `Resultado do último contato: ${t.ultimo_resultado}` : ''}

REGRAS CRÍTICAS:
- Gere UMA mensagem curta, humana, pronta para copiar e enviar no WhatsApp.
- NÃO repita a abordagem da última mensagem enviada — evolua a conversa.
- Se o cliente não respondeu, use uma abordagem de follow-up (Takeaway, urgência, curiosidade).
- NUNCA use "o que acha?" — use Fechamento Pressuposto ou Alternativa.
- Seja simpático, use emojis com moderação.
- A academia é FORMATO LIVRE (sem reservas/vagas).
- Se o cliente NUNCA foi aluno, NÃO diga "voltar" ou "retornar".

Gere a mensagem agora.`;
}
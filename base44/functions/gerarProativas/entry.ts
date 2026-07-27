import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  loadConfig,
  evaluateSafety,
  estimateTokens,
  estimateCredits,
} from '../../shared/automationRules.ts';
import { computeConsumption, summarizeSkips } from '../../shared/automationBudget.ts';
import {
  countByPublic,
  buildStageMap,
  buildTaskForCustomer,
  buildProactivePrompt,
} from '../../shared/proactiveShared.ts';

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
    const due = customers.filter((c) => c.next_action_date && new Date(c.next_action_date) <= today).slice(0, limit);

    // 4. Régua da biblioteca
    const { entries, stageToEntry } = await buildStageMap(base44);

    const tasks = [];
    const skips = [];

    // 5. Para cada cliente devido, avalia segurança e prepara a tarefa
    for (const c of due) {
      // Checagens baratas primeiro (horário + cooldown via last_interaction_date) — evita query desnecessária
      const cheap = evaluateSafety(c, [], config, new Date());
      if (!cheap.canSend) {
        skips.push({ cliente: c.name, motivo: cheap.reason });
        continue;
      }
      // Só busca o histórico se passou das checagens de tempo
      const task = await buildTaskForCustomer(base44, c, entries, stageToEntry);

      const safety = evaluateSafety(c, task.interactions, config, new Date());
      if (!safety.canSend) {
        skips.push({ cliente: c.name, motivo: safety.reason });
        continue;
      }
      if (!task.library_entry_id) {
        skips.push({ cliente: c.name, motivo: 'Régua não encontrada para o estágio' });
        continue;
      }

      tasks.push(task);
    }

    // 6. Simulação: retorna sem chamar IA nem gravar (mas registra log)
    if (config.auto_mode === 'simulacao' || forceSim) {
      const tokensEst = tasks.reduce((s, t) => s + estimateTokens(t.base_answer || ''), 0);
      await base44.asServiceRole.entities.AutomationLog.create({
        run_date: new Date().toISOString(),
        mode: 'simulacao',
        triggered_by: triggeredBy,
        customers_due: due.length,
        messages_generated: 0,
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
        tarefas: tasks.map((t) => ({
          customer_id: t.customer_id,
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
    let llmCalls = 0;
    let totalTokens = 0;

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
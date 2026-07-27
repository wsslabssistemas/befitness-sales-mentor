import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  loadConfig,
  evaluateSafety,
  estimateTokens,
  estimateCredits,
} from '../../shared/automationRules.ts';
import { computeConsumption, summarizeSkips } from '../../shared/automationBudget.ts';
import { buildStageMap, buildTaskForCustomer, buildProactivePrompt } from '../../shared/proactiveShared.ts';

// Envio aprovado manualmente: recebe customer_ids selecionados na prévia da simulação,
// gera a mensagem via IA, grava a Interaction e atualiza o cliente.
// Respeita cooldown + limite de não-respostas + orçamento + limite diário,
// mas IGNORA a janela de horário (o usuário aprovou manualmente).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) { /* defaults */ }
    const customerIds = Array.isArray(body.customer_ids) ? body.customer_ids : [];
    if (customerIds.length === 0) {
      return Response.json({ error: 'Nenhum cliente selecionado' }, { status: 400 });
    }

    const settings = await base44.asServiceRole.entities.Setting.list();
    const config = loadConfig(settings);

    const recentLogs = await base44.asServiceRole.entities.AutomationLog.list('-run_date', 50);
    const { budgetReached, consumedToday } = computeConsumption(recentLogs, config);
    if (budgetReached) {
      return Response.json({ error: 'Orçamento mensal atingido. Envio bloqueado até a virada do ciclo.' }, { status: 403 });
    }
    let dailyRemaining = Math.max(0, config.max_messages_per_day - consumedToday);

    const { entries, stageToEntry } = await buildStageMap(base44);

    const generated = [];
    const skips = [];
    let llmCalls = 0;
    let totalTokens = 0;

    for (const id of customerIds) {
      if (dailyRemaining <= 0) {
        skips.push({ cliente_id: id, motivo: 'Limite diário atingido' });
        continue;
      }
      let customer;
      try {
        customer = await base44.asServiceRole.entities.Customer.get(id);
      } catch (_) {
        skips.push({ cliente_id: id, motivo: 'Cliente não encontrado' });
        continue;
      }

      const task = await buildTaskForCustomer(base44, customer, entries, stageToEntry);
      if (!task.library_entry_id) {
        skips.push({ cliente: customer.name, motivo: 'Régua não encontrada para o estágio' });
        continue;
      }

      // Segurança: cooldown + não-respostas + stop bothering, mas IGNORA janela de horário (aprovado manual).
      const safety = evaluateSafety(customer, task.interactions, config, new Date(), true);
      if (!safety.canSend) {
        skips.push({ cliente: customer.name, motivo: safety.reason });
        continue;
      }

      const prompt = buildProactivePrompt(task);
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
        skips.push({ cliente: customer.name, motivo: 'Erro na IA: ' + e.message });
        continue;
      }

      const mensagem = response.mensagem || task.base_answer;

      await base44.asServiceRole.entities.Interaction.create({
        customer_id: customer.id,
        customer_name: customer.name,
        conversation: task.ultima_msg_cliente || '(mensagem proativa aprovada)',
        suggested_response: mensagem,
        objective: task.objective || '',
        explanation: 'Mensagem proativa aprovada manualmente',
        techniques: response.tecnica || task.technique || '',
        next_step: 'Aguardar resposta do cliente',
        result: 'pendente',
        handled_by: user.full_name || 'Manual',
        profile_used: 'outro',
      });

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 5);
      await base44.asServiceRole.entities.Customer.update(customer.id, {
        last_interaction_date: new Date().toISOString(),
        next_action: 'Aguardar resposta da mensagem proativa',
        next_action_date: nextDate.toISOString().split('T')[0],
      });

      generated.push({ cliente: customer.name, mensagem });
      dailyRemaining--;
    }

    await base44.asServiceRole.entities.AutomationLog.create({
      run_date: new Date().toISOString(),
      mode: 'automatico',
      triggered_by: 'manual',
      customers_due: customerIds.length,
      messages_generated: generated.length,
      messages_skipped: skips.length,
      skip_reasons: summarizeSkips(skips),
      llm_calls: llmCalls,
      estimated_tokens: totalTokens,
      estimated_credits: estimateCredits(llmCalls),
      status: 'ok',
    });

    return Response.json({
      mode: 'envio_aprovado',
      enviados: generated.length,
      bloqueados: skips.length,
      llm_calls: llmCalls,
      estimated_credits: estimateCredits(llmCalls),
      generated: generated.slice(0, 30),
      bloqueios: skips,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
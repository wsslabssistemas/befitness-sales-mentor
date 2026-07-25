import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Modo simulação: gera as mensagens proativas mas NÃO grava nem envia nada.
// Quando dry_run=false (futuro), grava Interaction e atualiza next_action do cliente.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) { /* sem body = defaults */ }
    const dryRun = body.dry_run !== false; // default: true (simulação)
    const limit = body.limit || 50;

    // 1. Achar a categoria "Relacionamento Ativo"
    const categories = await base44.asServiceRole.entities.LibraryCategory.list();
    const relCat = categories.find(c => c.name.toLowerCase().includes('relacionamento'));
    if (!relCat) {
      return Response.json({ error: 'Categoria "Relacionamento Ativo" não encontrada' }, { status: 404 });
    }

    // 2. Carregar entradas da biblioteca dessa categoria
    const entries = await base44.asServiceRole.entities.LibraryEntry.filter({ category_id: relCat.id });
    const findEntry = (keyword) => entries.find(e => e.question.toLowerCase().includes(keyword));

    const mapEntries = {
      sem_matricula: findEntry('cliente sem matrícula'),
      sem_matricula_followup: findEntry('não respondeu à primeira') || findEntry('cliente sem matrícula'),
      sem_matricula_pensar: findEntry('disse') && findEntry('vou pensar') ? findEntry('vou pensar') : null,
      convenio: findEntry('cliente com convênio'),
      convenio_outro_lugar: findEntry('já treina em outro') || findEntry('cliente com convênio'),
      matriculado: findEntry('cliente matriculado'),
      matriculado_trial: findEntry('período de trial') || findEntry('cliente matriculado'),
      matriculado_churn: findEntry('parou de frequentar') || findEntry('cliente matriculado'),
    };

    // 3. Buscar clientes com next_action_date vencida (hoje ou antes)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const customers = await base44.asServiceRole.entities.Customer.list('-next_action_date', 200);
    const due = customers.filter(c =>
      c.next_action_date && new Date(c.next_action_date) <= today
    ).slice(0, limit);

    // 4. Para cada cliente devido, descobrir o público e escolher a entrada
    const tasks = [];
    for (const c of due) {
      const publico = detectPublic(c);
      let entry;
      if (publico === 'matriculado') {
        entry = isOnTrial(c) ? mapEntries.matriculado_trial : mapEntries.matriculado;
      } else if (publico === 'convenio') {
        entry = mapEntries.convenio;
      } else {
        // sem matrícula: se já tem interação pendente recente, usar follow-up
        const interactions = await base44.asServiceRole.entities.Interaction.filter({ customer_id: c.id }, '-created_date', 3);
        const hasPendente = interactions.some(i => i.result === 'pendente' || i.result === 'nao_respondeu');
        entry = hasPendente ? mapEntries.sem_matricula_followup : mapEntries.sem_matricula;
      }

      if (!entry) continue;

      tasks.push({
        customer_id: c.id,
        customer_name: c.name,
        phone: c.phone || '',
        status: c.status,
        publico,
        next_action: c.next_action || '',
        next_action_date: c.next_action_date || '',
        library_entry_id: entry.id,
        library_question: entry.question,
        base_answer: entry.answer,
        technique: entry.technique || '',
        objective: entry.objective || '',
      });
    }

    // 5. Modo simulação: retorna o que SERIA enviado (sem chamar IA nem gravar)
    if (dryRun) {
      return Response.json({
        mode: 'simulacao',
        data_geracao: todayStr,
        total_clientes_due: due.length,
        total_tarefas: tasks.length,
        resumo_por_publico: countByPublic(tasks),
        tarefas: tasks.map(t => ({
          cliente: t.customer_name,
          telefone: t.phone,
          publico: t.publico,
          status_atual: t.status,
          proxima_acao_atual: t.next_action,
          data_vencida: t.next_action_date,
          pergunta_base: t.library_question,
          mensagem_base: t.base_answer,
          tecnica: t.technique,
          objetivo: t.objective,
        })),
      });
    }

    // 6. Modo real (futuro): gerar via IA + gravar Interaction + atualizar cliente
    // Por segurança, só chega aqui com dry_run=false explícito.
    return Response.json({ error: 'Modo automático ainda não habilitado. Use dry_run=true.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function detectPublic(c) {
  const source = (c.lead_source || '').toLowerCase();
  if (source.includes('totalpass') || source.includes('wellhub') || source.includes('convên') || source.includes('conveni')) {
    return 'convenio';
  }
  if (c.status === 'matriculado' || c.status === 'renovado') {
    return 'matriculado';
  }
  return 'sem_matricula';
}

function isOnTrial(c) {
  if (!c.trial_start_date) return false;
  const start = new Date(c.trial_start_date);
  const days = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 7;
}

function countByPublic(tasks) {
  const counts = { sem_matricula: 0, convenio: 0, matriculado: 0 };
  for (const t of tasks) counts[t.publico] = (counts[t.publico] || 0) + 1;
  return counts;
}
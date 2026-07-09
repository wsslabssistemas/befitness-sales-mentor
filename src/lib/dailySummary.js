import { base44 } from '@/api/base44Client';

export async function sendDailySummary(teamEmail) {
  const [customers, interactions] = await Promise.all([
    base44.entities.Customer.list('-created_date', 200),
    base44.entities.Interaction.list('-created_date', 500),
  ]);

  const now = new Date();
  const todayDate = new Date(now); todayDate.setHours(0, 0, 0, 0);
  const weekEnd = new Date(todayDate); weekEnd.setDate(weekEnd.getDate() + 7);
  const threeDaysAgo = new Date(todayDate); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const sevenDaysAgo = new Date(todayDate); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const active = customers.filter(c => c.status !== 'matriculado' && c.status !== 'perdido');

  // 1. Retornos atrasados
  const overdue = active.filter(c => c.next_action_date && new Date(c.next_action_date) < todayDate);

  // 2. Para hoje
  const todayActions = active.filter(c => c.next_action_date && new Date(c.next_action_date).toDateString() === todayDate.toDateString());

  // 3. Esta semana
  const upcoming = active.filter(c => {
    if (!c.next_action_date) return false;
    const d = new Date(c.next_action_date);
    return d > todayDate && d <= weekEnd;
  });

  // 4. Leads esfriando (sem interação há 7+ dias, ainda ativos)
  const cooling = active.filter(c => {
    const ref = c.last_interaction_date ? new Date(c.last_interaction_date) : new Date(c.created_date);
    return ref < sevenDaysAgo;
  }).sort((a, b) => {
    const da = a.last_interaction_date ? new Date(a.last_interaction_date) : new Date(a.created_date);
    const db = b.last_interaction_date ? new Date(b.last_interaction_date) : new Date(b.created_date);
    return da - db;
  });

  // 5. Novos leads sem atendimento (criados nos últimos 3 dias, sem nenhuma interação)
  const customerIdsWithInteraction = new Set(interactions.map(i => i.customer_id));
  const newLeadsNoInteraction = customers.filter(c => {
    if (c.status === 'matriculado' || c.status === 'perdido') return false;
    if (customerIdsWithInteraction.has(c.id)) return false;
    return new Date(c.created_date) >= threeDaysAgo;
  });

  // 6. KPIs do mês corrente
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCustomers = customers.filter(c => new Date(c.created_date) >= monthStart);
  const monthInteractions = interactions.filter(i => new Date(i.created_date) >= monthStart);
  const mMatriculas = monthInteractions.filter(i => i.result === 'matriculou').length;
  const mVisitas = monthInteractions.filter(i => i.result === 'marcou_visita').length;
  const mTrials = monthInteractions.filter(i => i.result === 'semana_experimental').length;
  const mTotalAtend = monthInteractions.length;
  const mTaxa = mTotalAtend > 0 ? ((mMatriculas / mTotalAtend) * 100).toFixed(1) : 0;

  // 7. Matrículas recentes (últimos 7 dias)
  const recentMatriculas = interactions.filter(i =>
    i.result === 'matriculou' && new Date(i.created_date) >= sevenDaysAgo
  );

  // Verifica se há algo para reportar
  if (overdue.length === 0 && todayActions.length === 0 && upcoming.length === 0
      && cooling.length === 0 && newLeadsNoInteraction.length === 0
      && mTotalAtend === 0 && recentMatriculas.length === 0) {
    return { sent: false, reason: 'nothing' };
  }

  const monthName = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][now.getMonth()];

  let body = `📋 RESUMO DIÁRIO — BE FITNESS\n${todayDate.toLocaleDateString('pt-BR')}\n\n`;

  // KPIs do mês
  body += `📊 FECHAMENTO DO MÊS (${monthName}/${now.getFullYear()}):\n`;
  body += `• Novos leads: ${monthCustomers.length}\n`;
  body += `• Atendimentos: ${mTotalAtend}\n`;
  body += `• Visitas agendadas: ${mVisitas}\n`;
  body += `• Trials iniciados: ${mTrials}\n`;
  body += `• Matrículas: ${mMatriculas}\n`;
  body += `• Taxa de conversão: ${mTaxa}%\n\n`;

  // Matrículas recentes
  if (recentMatriculas.length > 0) {
    body += `🏆 MATRÍCULAS DOS ÚLTIMOS 7 DIAS (${recentMatriculas.length}):\n`;
    body += recentMatriculas.map(i => `• ${i.customer_name || 'Cliente'} — atendido por: ${i.handled_by || 'N/A'}`).join('\n') + '\n\n';
  }

  // Retornos atrasados
  if (overdue.length > 0) {
    body += `⚠️ RETORNOS ATRASADOS (${overdue.length}) — PRIORIDADE MÁXIMA:\n`;
    body += overdue.map(c => `• ${c.name} — ${c.next_action || 'Sem ação'} (vencimento: ${c.next_action_date})${c.assigned_to ? ` | Resp: ${c.assigned_to}` : ''}`).join('\n') + '\n\n';
  }

  // Para hoje
  if (todayActions.length > 0) {
    body += `📌 PARA HOJE (${todayActions.length}):\n`;
    body += todayActions.map(c => `• ${c.name} — ${c.next_action}${c.assigned_to ? ` | Resp: ${c.assigned_to}` : ''}`).join('\n') + '\n\n';
  }

  // Novos leads sem atendimento
  if (newLeadsNoInteraction.length > 0) {
    body += `⚡ NOVOS LEADS SEM ATENDIMENTO (${newLeadsNoInteraction.length}) — RESPOSTA RÁPIDA = CONVERSÃO:\n`;
    body += newLeadsNoInteraction.map(c => `• ${c.name}${c.phone ? ` — ${c.phone}` : ''}${c.lead_source ? ` (origem: ${c.lead_source})` : ''}`).join('\n') + '\n\n';
  }

  // Leads esfriando
  if (cooling.length > 0) {
    body += `🥶 LEADS ESFRIANDO (${cooling.length}) — SEM CONTATO HÁ 7+ DIAS:\n`;
    body += cooling.slice(0, 15).map(c => {
      const lastDate = c.last_interaction_date ? new Date(c.last_interaction_date).toLocaleDateString('pt-BR') : new Date(c.created_date).toLocaleDateString('pt-BR');
      return `• ${c.name} — último contato: ${lastDate} — ${c.next_action || 'Reabordar'}`;
    }).join('\n') + '\n\n';
  }

  // Esta semana
  if (upcoming.length > 0) {
    body += `📅 ESTA SEMANA (${upcoming.length}):\n`;
    body += upcoming.map(c => `• ${c.name} — ${c.next_action} (${c.next_action_date})`).join('\n') + '\n\n';
  }

  body += `💪 Bom trabalho hoje! Acesse o sistema para iniciar os atendimentos.`;

  await base44.integrations.Core.SendEmail({
    to: teamEmail,
    from_name: 'Be Fitness',
    subject: `📋 Resumo Diário Be Fitness — ${todayDate.toLocaleDateString('pt-BR')} (${overdue.length} atrasado(s), ${todayActions.length} para hoje, ${newLeadsNoInteraction.length} novo(s) lead(s))`,
    body,
  });

  return {
    sent: true,
    overdue: overdue.length,
    today: todayActions.length,
    upcoming: upcoming.length,
    cooling: cooling.length,
    newLeads: newLeadsNoInteraction.length,
    matriculas: mMatriculas,
    recentMatriculas: recentMatriculas.length,
  };
}
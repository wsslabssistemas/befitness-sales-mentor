import { base44 } from '@/api/base44Client';

export async function sendDailySummary(teamEmail) {
  const customers = await base44.entities.Customer.list('-created_date', 200);
  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
  const weekEnd = new Date(todayDate); weekEnd.setDate(weekEnd.getDate() + 7);
  const active = customers.filter(c => c.status !== 'matriculado' && c.status !== 'perdido');

  const overdue = active.filter(c => c.next_action_date && new Date(c.next_action_date) < todayDate);
  const todayActions = active.filter(c => c.next_action_date && new Date(c.next_action_date).toDateString() === todayDate.toDateString());
  const upcoming = active.filter(c => {
    if (!c.next_action_date) return false;
    const d = new Date(c.next_action_date);
    return d > todayDate && d <= weekEnd;
  });

  if (overdue.length === 0 && todayActions.length === 0 && upcoming.length === 0) {
    return { sent: false, reason: 'nothing' };
  }

  let body = `📋 Resumo Diário — Be Fitness\n\n`;

  if (overdue.length > 0) {
    body += `⚠️ RETORNOS ATRASADOS (${overdue.length}):\n`;
    body += overdue.map(c => `• ${c.name} — ${c.next_action || 'Sem ação'} (vencimento: ${c.next_action_date})`).join('\n') + '\n\n';
  }

  if (todayActions.length > 0) {
    body += `📌 PARA HOJE (${todayActions.length}):\n`;
    body += todayActions.map(c => `• ${c.name} — ${c.next_action}`).join('\n') + '\n\n';
  }

  if (upcoming.length > 0) {
    body += `📅 ESTA SEMANA (${upcoming.length}):\n`;
    body += upcoming.map(c => `• ${c.name} — ${c.next_action} (${c.next_action_date})`).join('\n') + '\n\n';
  }

  body += `Acesse o sistema para iniciar os atendimentos.`;

  await base44.integrations.Core.SendEmail({
    to: teamEmail,
    subject: `📋 Resumo Diário — Be Fitness (${overdue.length} atrasado(s), ${todayActions.length} para hoje)`,
    body,
  });

  return { sent: true, overdue: overdue.length, today: todayActions.length, upcoming: upcoming.length };
}
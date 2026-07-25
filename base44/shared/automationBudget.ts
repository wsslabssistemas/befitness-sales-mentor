// Cálculo de consumo (limite diário + orçamento mensal) e helpers de log compartilhados
// entre as automações (gerarProativas e facebookAutoReply).

export function computeConsumption(recentLogs, config, now = new Date()) {
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const consumedToday = (recentLogs || [])
    .filter(l => l.run_date && new Date(l.run_date) >= todayStart && l.mode === 'automatico')
    .reduce((s, l) => s + (l.messages_generated || 0), 0);
  const dailyRemaining = Math.max(0, config.max_messages_per_day - consumedToday);

  const monthSpent = (recentLogs || [])
    .filter(l => l.run_date && new Date(l.run_date) >= monthStart && l.mode === 'automatico')
    .reduce((s, l) => s + (l.estimated_credits || 0), 0);
  const budgetReached = config.monthly_credit_budget > 0 && monthSpent >= config.monthly_credit_budget;

  return { consumedToday, dailyRemaining, monthSpent, budgetReached };
}

export function summarizeSkips(skips) {
  const map = {};
  for (const s of (skips || [])) map[s.motivo] = (map[s.motivo] || 0) + 1;
  return Object.entries(map).map(([k, v]) => `${k}: ${v}`).join(' | ');
}
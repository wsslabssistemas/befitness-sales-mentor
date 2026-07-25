// Regras anti-bloqueio + detecção de estágio para a automação proativa.
// Compartilhado entre o backend function e qualquer lógica futura.

export const DEFAULT_CONFIG = {
  max_messages_per_day: 30,
  min_hours_between_contacts: 24,
  max_unanswered_contacts: 3,
  cooldown_after_reply_hours: 48,
  working_window_start: 9,
  working_window_end: 19,
  stop_bothering_days: 14,
  monthly_credit_budget: 0,
  auto_mode: 'off',
};

const ENGAGED_RESULTS = ['respondeu', 'marcou_visita', 'semana_experimental', 'matriculou'];

export function loadConfig(settingsArr) {
  const map = {};
  for (const s of (settingsArr || [])) map[s.key] = s.value;
  const num = (k, fallback) => {
    const v = Number(map[k]);
    return Number.isFinite(v) && v > 0 ? v : fallback;
  };
  return {
    ...DEFAULT_CONFIG,
    max_messages_per_day: num('auto_max_per_day', DEFAULT_CONFIG.max_messages_per_day),
    min_hours_between_contacts: num('auto_min_hours', DEFAULT_CONFIG.min_hours_between_contacts),
    max_unanswered_contacts: num('auto_max_unanswered', DEFAULT_CONFIG.max_unanswered_contacts),
    cooldown_after_reply_hours: num('auto_cooldown_hours', DEFAULT_CONFIG.cooldown_after_reply_hours),
    working_window_start: num('auto_window_start', DEFAULT_CONFIG.working_window_start),
    working_window_end: num('auto_window_end', DEFAULT_CONFIG.working_window_end),
    stop_bothering_days: num('auto_stop_days', DEFAULT_CONFIG.stop_bothering_days),
    monthly_credit_budget: num('auto_monthly_budget', DEFAULT_CONFIG.monthly_credit_budget),
    auto_mode: map.auto_mode || 'off',
  };
}

export function configToSettings(config) {
  return [
    { key: 'auto_mode', value: config.auto_mode },
    { key: 'auto_max_per_day', value: String(config.max_messages_per_day) },
    { key: 'auto_min_hours', value: String(config.min_hours_between_contacts) },
    { key: 'auto_max_unanswered', value: String(config.max_unanswered_contacts) },
    { key: 'auto_cooldown_hours', value: String(config.cooldown_after_reply_hours) },
    { key: 'auto_window_start', value: String(config.working_window_start) },
    { key: 'auto_window_end', value: String(config.working_window_end) },
    { key: 'auto_stop_days', value: String(config.stop_bothering_days) },
    { key: 'auto_monthly_budget', value: String(config.monthly_credit_budget) },
  ];
}

// Avalia se a automação PODE gerar uma mensagem proativa para o cliente.
// Retorna { canSend: boolean, reason: string }
export function evaluateSafety(customer, lastInteractions, config, now = new Date()) {
  const interactions = lastInteractions || [];

  // 1. Janela de horário (evita mandar fora do horário comercial) — fuso de São Paulo
  const hour = getSPHour(now);
  if (hour < config.working_window_start || hour >= config.working_window_end) {
    return { canSend: false, reason: 'Fora da janela de horário permitida' };
  }

  // 2. Cooldown desde o último contato
  if (customer.last_interaction_date) {
    const last = new Date(customer.last_interaction_date);
    const hoursSince = (now - last) / 3600000;
    const lastResult = interactions[0]?.result;
    const lastEngaged = ENGAGED_RESULTS.includes(lastResult);
    const cooldown = lastEngaged
      ? config.cooldown_after_reply_hours
      : config.min_hours_between_contacts;
    if (hoursSince < cooldown) {
      return { canSend: false, reason: `Em cooldown (${Math.max(0, Math.round(cooldown - hoursSince))}h restantes)` };
    }
  }

  // 3. Limite de não-respostas consecutivas (parar de incomodar)
  let unansweredStreak = 0;
  for (const i of interactions) {
    if (i.result === 'nao_respondeu' || i.result === 'pendente') unansweredStreak++;
    else break;
  }
  if (unansweredStreak >= config.max_unanswered_contacts) {
    return { canSend: false, reason: 'Limite de não-respostas atingido — parar de incomodar' };
  }

  // 4. Sem engajamento há muito tempo → parar de incomodar
  const lastEngagedInt = interactions.find(i => ENGAGED_RESULTS.includes(i.result));
  if (lastEngagedInt) {
    const daysSinceEngaged = (now - new Date(lastEngagedInt.created_date)) / 86400000;
    if (daysSinceEngaged > config.stop_bothering_days && unansweredStreak >= config.max_unanswered_contacts - 1) {
      return { canSend: false, reason: 'Sem engajamento recente — parar de incomodar' };
    }
  } else if (unansweredStreak >= config.max_unanswered_contacts) {
    return { canSend: false, reason: 'Nunca engajou e limite atingido — parar de incomodar' };
  }

  return { canSend: true, reason: 'ok' };
}

// Detecta o estágio da jornada para escolher a régua proativa certa
// Retorna a hora atual no fuso de São Paulo (America/Sao_Paulo)
export function getSPHour(now = new Date()) {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hour12: false,
    });
    return Number(fmt.format(now));
  } catch (_) {
    return now.getHours();
  }
}

export function detectStage(customer, now = new Date()) {
  const status = customer.status;
  const days = (startStr) => Math.floor((now - new Date(startStr)) / 86400000);

  if (status === 'perdido') {
    if (!customer.lost_date) return 'reativacao';
    const d = days(customer.lost_date);
    if (d >= 365) return 'reativacao_365';
    if (d >= 180) return 'reativacao_180';
    if (d >= 90) return 'reativacao_90';
    return 'reativacao';
  }
  if (status === 'matriculado' || status === 'renovado') {
    if (!customer.enrollment_date) return 'posvenda';
    const d = days(customer.enrollment_date);
    if (d >= 90) return 'retencao_90';
    if (d >= 60) return 'retencao_60';
    if (d >= 45) return 'retencao_45';
    if (d >= 30) return 'retencao_30';
    return 'posvenda';
  }
  if (status === 'semana_experimental') return 'trial';
  if (status === 'negociacao') return 'negociacao';
  if (status === 'proposta_enviada') return 'proposta';
  if (status === 'descobrindo_necessidade') return 'descoberta';
  return 'contato';
}

// Estimativa simples de tokens (aproximação: 1 token ≈ 4 chars)
export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

// Estimativa de créditos: 1 crédito por chamada de IA (modelo padrão)
export function estimateCredits(llmCalls) {
  return Math.max(0, Math.ceil(llmCalls));
}
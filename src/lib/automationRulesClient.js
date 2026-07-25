// Versão frontend das constantes de configuração da automação.
// A lógica de segurança (evaluateSafety) fica só no backend (base44/shared/automationRules.ts).

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
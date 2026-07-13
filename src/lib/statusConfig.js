export const STATUS_CONFIG = {
  novo_contato: {
    label: 'Novo Contato',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
  descobrindo_necessidade: {
    label: 'Descobrindo',
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  proposta_enviada: {
    label: 'Proposta Enviada',
    dot: 'bg-orange-400',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  },
  semana_experimental: {
    label: 'Semana Experimental',
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  negociacao: {
    label: 'Negociação',
    dot: 'bg-purple-400',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  },
  matriculado: {
    label: 'Matriculado',
    dot: 'bg-slate-400',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
  },
  perdido: {
    label: 'Perdido',
    dot: 'bg-slate-600',
    badge: 'bg-slate-700/40 text-slate-400 border-slate-600/30',
  },
};

export const PROFILE_CONFIG = {
  iniciante: { label: 'Iniciante', emoji: '🏃' },
  experiente: { label: 'Experiente', emoji: '💪' },
  emagrecer: { label: 'Quer Emagrecer', emoji: '⚖️' },
  saude: { label: 'Saúde', emoji: '🏥' },
  melhor_idade: { label: 'Melhor Idade', emoji: '👴' },
  outro: { label: 'Outro', emoji: '👤' },
};

export const RESULT_CONFIG = {
  pendente: { label: 'Pendente', badge: 'bg-slate-700/40 text-slate-400 border-slate-600/30' },
  respondeu: { label: 'Cliente respondeu', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  marcou_visita: { label: 'Marcou visita', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  semana_experimental: { label: 'Iniciou semana experimental', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  matriculou: { label: 'Matriculou', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  nao_respondeu: { label: 'Não respondeu', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  desistiu: { label: 'Desistiu', badge: 'bg-slate-700/40 text-slate-400 border-slate-600/30' },
};

export const RESULT_TO_STATUS = {
  respondeu: 'descobrindo_necessidade',
  marcou_visita: 'proposta_enviada',
  semana_experimental: 'semana_experimental',
  matriculou: 'matriculado',
  nao_respondeu: null,
  desistiu: 'perdido',
  pendente: null,
};
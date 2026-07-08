export const STATUS_CONFIG = {
  novo_contato: {
    label: 'Novo Contato',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  descobrindo_necessidade: {
    label: 'Descobrindo',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  proposta_enviada: {
    label: 'Proposta Enviada',
    dot: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  semana_experimental: {
    label: 'Semana Experimental',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  negociacao: {
    label: 'Negociação',
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  matriculado: {
    label: 'Matriculado',
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  perdido: {
    label: 'Perdido',
    dot: 'bg-gray-700',
    badge: 'bg-gray-800 text-white border-gray-800',
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
  pendente: { label: 'Pendente', badge: 'bg-gray-100 text-gray-500 border-gray-200' },
  respondeu: { label: 'Cliente respondeu', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  marcou_visita: { label: 'Marcou visita', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  semana_experimental: { label: 'Iniciou semana experimental', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  matriculou: { label: 'Matriculou', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  nao_respondeu: { label: 'Não respondeu', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  desistiu: { label: 'Desistiu', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
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
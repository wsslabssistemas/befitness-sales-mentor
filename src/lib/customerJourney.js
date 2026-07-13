import { GYM_HOURS_TEXT } from '@/lib/gymHours';
import { getTrialInfo, buildTrialPrompt } from '@/lib/trialJourney';

export const JOURNEY_STAGES = [
  { id: 'contato', label: 'Contato', subtitle: 'Quebrar o gelo', icon: '🎯' },
  { id: 'descoberta', label: 'Descoberta', subtitle: 'Qualificar', icon: '🔍' },
  { id: 'proposta', label: 'Proposta', subtitle: 'Apresentar', icon: '📋' },
  { id: 'trial', label: 'Trial', subtitle: 'Acompanhar', icon: '🎁' },
  { id: 'matriculado', label: 'Matriculado', subtitle: 'Retenção', icon: '🎉' },
];

const STATUS_LEVEL = {
  novo_contato: 0,
  descobrindo_necessidade: 1,
  proposta_enviada: 2,
  negociacao: 2,
  semana_experimental: 3,
  matriculado: 4,
  perdido: -1,
};

const STAGE_GUIDANCE = {
  contato: 'Descubra o objetivo do cliente. Faça uma pergunta aberta. NÃO envie preços completos ainda.',
  descoberta: 'Qualifique o lead. Entenda o que motiva o cliente e gere desejo.',
  proposta: 'Apresente as 3 formas de pagamento e agende visita ou trial.',
  negociacao: 'Trate as objeções e conduza ao fechamento ou trial.',
  trial: 'Acompanhe a experiência nos dias 2, 6 e 8.',
  matriculado: 'Acompanhe o aluno e prepare para a renovação.',
};

const PLAN_DURATION_DAYS = {
  trimestral: 90,
  semestral: 180,
  anual: 365,
};

const RETENTION_MILESTONES = [30, 45, 60, 90];

export function getJourneyInfo(customer, interactions = []) {
  const level = STATUS_LEVEL[customer.status] ?? 0;
  const isLost = customer.status === 'perdido';

  const stages = JOURNEY_STAGES.map((stage, i) => ({
    ...stage,
    done: !isLost && i < level,
    current: !isLost && i === level,
    pending: !isLost && i > level,
  }));

  const currentStageId = isLost ? null : (level >= 0 && level <= 4 ? JOURNEY_STAGES[level].id : 'contato');

  let trialInfo = null;
  if (customer.status === 'semana_experimental') {
    trialInfo = getTrialInfo(customer.trial_start_date, interactions, customer.status);
  }

  let retentionInfo = null;
  if (customer.status === 'matriculado') {
    retentionInfo = getRetentionInfo(customer, interactions);
  }

  return {
    stages,
    currentStageId,
    isLost,
    trialInfo,
    retentionInfo,
    guidance: STAGE_GUIDANCE[currentStageId] || STAGE_GUIDANCE.contato,
  };
}

export function getRenewalInfo(customer) {
  if (customer.status !== 'matriculado' || !customer.enrollment_date) return null;

  const start = new Date(customer.enrollment_date + 'T00:00:00');
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const daysEnrolled = Math.floor((now - start) / 86400000);
  const duration = PLAN_DURATION_DAYS[customer.plan_type] || 90;
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + duration);
  const daysUntilRenewal = Math.floor((endDate - now) / 86400000);

  return { daysEnrolled, daysUntilRenewal, endDate, duration };
}

export function getRenewalAlert(customer) {
  const info = getRenewalInfo(customer);
  if (!info) return null;
  if (info.daysUntilRenewal <= 30 && info.daysUntilRenewal >= -10) {
    return { daysUntilRenewal: info.daysUntilRenewal, urgent: info.daysUntilRenewal <= 15 };
  }
  return null;
}

export function getRetentionInfo(customer, interactions = []) {
  if (customer.status !== 'matriculado' || !customer.enrollment_date) return null;

  const start = new Date(customer.enrollment_date + 'T00:00:00');
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysEnrolled = Math.floor((now - start) / 86400000);

  const hasInteractionOnOrAfter = (daysAfterStart) => {
    const threshold = new Date(start);
    threshold.setDate(threshold.getDate() + daysAfterStart);
    return interactions.some(i => new Date(i.created_date) >= threshold);
  };

  const milestones = RETENTION_MILESTONES.map(m => ({
    day: m,
    due: daysEnrolled >= m,
    done: daysEnrolled >= m && hasInteractionOnOrAfter(m - 5),
  }));

  const currentMilestone = milestones.find(m => m.due && !m.done);

  return { daysEnrolled, milestones, currentMilestoneDay: currentMilestone?.day || null };
}

export function getRetentionAlert(customer) {
  if (customer.status !== 'matriculado' || !customer.enrollment_date) return null;

  const start = new Date(customer.enrollment_date + 'T00:00:00');
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysEnrolled = Math.floor((now - start) / 86400000);

  const lastInt = customer.last_interaction_date ? new Date(customer.last_interaction_date) : null;

  for (const m of RETENTION_MILESTONES) {
    if (daysEnrolled >= m) {
      const threshold = new Date(start);
      threshold.setDate(threshold.getDate() + m - 5);
      if (!lastInt || lastInt < threshold) {
        return { milestone: m, daysEnrolled };
      }
    }
  }
  return null;
}

export function getMessageStage(customer, journeyInfo, renewalInfo) {
  const { currentStageId, trialInfo, isLost } = journeyInfo;

  if (isLost) return { stage: 'reativacao', label: 'Reativação' };

  if (currentStageId === 'trial') {
    if (!trialInfo || !trialInfo.currentStageId) return null;
    const trialLabels = { checkin: 'Acompanhamento', preclose: 'Pré-fechamento', conversao: 'Conversão' };
    return { stage: trialInfo.currentStageId, label: trialLabels[trialInfo.currentStageId] || 'Trial' };
  }

  if (currentStageId === 'matriculado') {
    if (!customer.enrollment_date) return null;
    if (renewalInfo && renewalInfo.daysUntilRenewal <= 30) return { stage: 'renovacao', label: 'Renovação' };
    if (journeyInfo.retentionInfo && journeyInfo.retentionInfo.currentMilestoneDay) {
      return { stage: `retencao_${journeyInfo.retentionInfo.currentMilestoneDay}`, label: `Acompanhamento (${journeyInfo.retentionInfo.currentMilestoneDay} dias)` };
    }
    if (renewalInfo && renewalInfo.daysEnrolled <= 14) return { stage: 'posvenda', label: 'Pós-venda' };
    return null;
  }

  if (customer.status === 'negociacao') return { stage: 'negociacao', label: 'Negociação' };
  if (currentStageId === 'proposta') return { stage: 'proposta', label: 'Proposta' };
  if (currentStageId === 'descoberta') return { stage: 'descoberta', label: 'Descoberta' };
  return { stage: 'contato', label: 'Primeiro Contato' };
}

const COMMON_INFO = `
DIFERENCIAIS DA BE FITNESS:
- Semana experimental gratuita (7 dias)
- Brinde de boas-vindas: aromatizador de carro personalizado
- Plano anual: bolsa térmica + chaveiro
- Acompanhamento de professores em todos os treinos
- Estrutura completa: vestiário, chuveiro, armário, estacionamento

HORÁRIO DE FUNCIONAMENTO:
${GYM_HOURS_TEXT}

PLANOS E VALORES — 3 FORMAS DE PAGAMENTO:
1. À VISTA (com desconto): Trimestral R$ 410 | Semestral R$ 580 | Anual R$ 958,80
2. PARCELADO NO CARTÃO (usa limite): Trimestral 3x R$ 149 | Semestral 6x R$ 108 | Anual 12x R$ 99
3. ANUAL RECORRENTE (não usa limite): Adesão R$ 59 + 11x R$ 109 (1ª cobrança R$ 168)

CONTATO: Av. Protásio Alves, 4780 - Porto Alegre | WhatsApp: (51) 98251-2270 | @befitnesspoa

REGRAS:
- Seja humano, natural, simpático. Use emojis com moderação.
- NUNCA use "o que acha?" — use Fechamento Pressuposto ou Alternativa.
- A mensagem deve ser pronta para copiar e enviar no WhatsApp.`;

const STAGE_CONFIGS = {
  contato: {
    title: 'PRIMEIRO CONTATO — O cliente pediu informações',
    goal: 'Quebrar o gelo, descobrir o objetivo do cliente e gerar interesse. NÃO envie a tabela de preços completa ainda.',
    techniques: `TÉCNICAS A APLICAR:
- Intelligence Gathering (Belfort): faça uma pergunta aberta — "Tu busca emagrecer, ganhar massa, ou saúde? Já treina?"
- Pattern Interrupt: quebre o padrão de mensagens comerciais genéricas — seja humano e personalizado
- Sell Yourself First (Girard): apresente-se pelo nome, construa confiança antes do produto
- Hot Button (Tracy): descubra o que motiva o cliente
- Curiosity Gap: deixe algo não resolvido para o cliente querer responder
- Transparência com valor: se perguntarem preço, dê uma FAIXA ("a partir de R$ 99/mês") mas descubra a necessidade primeiro`,
  },
  descoberta: {
    title: 'DESCOBERTA — Qualificando o lead',
    goal: 'Aprofundar a descoberta de necessidades, gerar desejo e preparar para apresentar a proposta.',
    techniques: `TÉCNICAS A APLICAR:
- Hot Button (Tracy): descubra o gatilho emocional — o que realmente motiva o cliente
- Value Preview (Hormozi): mostre um vislumbre do valor sem revelar tudo
- Future Pacing (Tracy): ajude a projetar o resultado desejado
- Open Questions: mantenha perguntas abertas para o cliente falar mais (escute 80%)`,
  },
  proposta: {
    title: 'PROPOSTA — Apresentando os planos',
    goal: 'Apresentar as formas de pagamento, agendar visita ou trial, e conduzir para o fechamento.',
    techniques: `TÉCNICAS A APLICAR:
- Grand Slam Offer (Hormozi): empilhe valor — semana grátis + brinde + acompanhamento + estrutura completa
- Reduction to the Ridiculous (Tracy): divida o custo por dia — "R$ 99/mês = R$ 3,30/dia"
- Assumptive Close: pergunte QUAL plano, não SE vai fechar
- Fechamento Alternativa: "Amanhã às 10h ou 18h?"
- Price Objection Looping: se relutar, trate como pedido de mais info`,
  },
  negociacao: {
    title: 'NEGOCIAÇÃO — Tratando objeções',
    goal: 'Tratar objeções do cliente e conduzir ao fechamento ou agendamento de trial.',
    techniques: `TÉCNICAS A APLICAR:
- Looping (Belfort): não argumente — reconstrua certeza no produto
- Porcupine (Tracy): responda pergunta com pergunta — "Se eu resolver o horário, fecharíamos hoje?"
- Reduction to the Ridiculous (Tracy): divida o custo por dia
- Grand Slam Offer (Hormozi): empilhe valor até o preço parecer irrelevante
- Assumptive Close: "Amanhã às 10h ou 18h para começar a semana experimental?"`,
  },
  posvenda: {
    title: 'PÓS-VENDA — Acompanhamento do novo aluno',
    goal: 'Acompanhar o novo aluno, prevenir arrependimento e gerar indicações.',
    techniques: `TÉCNICAS A APLICAR:
- Destroy Buyer Remorse (Girard): reforce a decisão — "Fez a melhor escolha"
- Rehash for Referrals (Belfort): peça indicações — "Conhece alguém que gostaria de treinar aqui?"
- Follow-up (Girard): mantenha contato genuíno, pergunte como estão os treinos
- Law of 250 (Girard): cada aluno = 250 indicações potenciais`,
  },
  renovacao: {
    title: 'RENOVAÇÃO — Plano se aproximando do vencimento',
    goal: 'Reter o aluno, prepará-lo para renovação e gerar indicações.',
    techniques: `TÉCNICAS A APLICAR:
- Destroy Buyer Remorse (Girard): reforce os resultados — "Como está sendo sua experiência?"
- Law of 250 (Girard): peça indicações — "Conhece alguém que gostaria de treinar aqui?"
- Loss Aversion (Kahneman): "Não perca o ritmo e os resultados que conquistou"
- Loyalty: mostre que é valorizado como aluno
- Se vencido: Takeaway Close (Tracy): "Sua vaga pode ser preenchida por outro aluno"`,
  },
  reativacao: {
    title: 'REATIVAÇÃO — Cliente perdido',
    goal: 'Reativar um cliente que desistiu ou esfriou. Gerar curiosidade e oferecer uma nova oportunidade.',
    techniques: `TÉCNICAS A APLICAR:
- Pattern Interrupt: quebre o padrão com uma abordagem diferente e humana
- Curiosity Gap: "Temos uma novidade que pode te interessar..."
- Takeaway: "Lembrei de você quando abriu uma vaga..."
- Loss Aversion: "Faz um tempo que não te vejo, não perca o ritmo"
- Puppy Dog Close: ofereça semana experimental novamente`,
  },
  retencao_30: {
    title: 'ACOMPANHAMENTO DE RETENÇÃO — 30 dias de matrícula',
    goal: 'O aluno completou 30 dias. Faça o primeiro check-in de retenção: verifique satisfação, reforce o hábito e peça indicações.',
    techniques: `TÉCNICAS A APLICAR:
- Destroy Buyer Remorse (Girard): "Como está sendo sua experiência até agora?"
- Habit Reinforcement: reforce que 30 dias é o marco — o hábito está se formando
- Rehash for Referrals (Belfort): "Conhece alguém que gostaria de treinar aqui?"
- Follow-up (Girard): mantenha contato genuíno, não apenas para vender`,
  },
  retencao_45: {
    title: 'ACOMPANHAMENTO DE RETENÇÃO — 45 dias de matrícula',
    goal: 'O aluno completou 45 dias. Reforce o progresso e mantenha o engajamento para prevenir desistência.',
    techniques: `TÉCNICAS A APLICAR:
- Future Pacing (Tracy): "Imagine daqui 3 meses com mais resultados"
- Progress Reinforcement: reforce o que já conquistou em 45 dias
- Rehash for Referrals (Belfort): peça indicações
- Habit Lock-in: "Você já criou o hábito, não pare agora"`,
  },
  retencao_60: {
    title: 'ACOMPANHAMENTO DE RETENÇÃO — 60 dias de matrícula',
    goal: 'O aluno completou 60 dias. Faça um check-in de progresso e comece a preparar a conversa de renovação.',
    techniques: `TÉCNICAS A APLICAR:
- Value Realization (Hormozi): faça o cliente verbalizar os resultados
- Progress Check: pergunte sobre mudanças físicas e de disposição
- Rehash for Referrals (Belfort): peça indicações
- Pre-renewal: "Daqui uns dias vamos conversar sobre sua renovação"`,
  },
  retencao_90: {
    title: 'ACOMPANHAMENTO DE RETENÇÃO — 90 dias de matrícula',
    goal: 'O aluno completou 90 dias. Celebre a conquista e prepare para a renovação.',
    techniques: `TÉCNICAS A APLICAR:
- Destroy Buyer Remorse (Girard): "3 meses! Fez a melhor escolha"
- Future Pacing (Tracy): "Imagine daqui 6 meses..."
- Loss Aversion (Kahneman): "Não perca o ritmo que conquistou"
- Rehash for Referrals (Belfort): peça indicações
- Renewal prep: prepare para a conversa de renovação`,
  },
};

export function buildStagePrompt(stageId, customer, interactions = []) {
  if (stageId === 'checkin' || stageId === 'preclose' || stageId === 'conversao') {
    return buildTrialPrompt(stageId, customer, interactions);
  }

  const profileLabel = customer.profile || 'outro';

  const historyText = interactions.length > 0
    ? 'HISTÓRICO (não repita abordagens já usadas):\n' +
      interactions.slice(0, 5).map(i =>
        `- Resposta: ${i.suggested_response || 'N/A'} | Resultado: ${i.result || 'pendente'}`
      ).join('\n')
    : 'Sem atendimentos anteriores.';

  const stage = STAGE_CONFIGS[stageId];
  if (!stage) return null;

  return `Você é o Assistente Comercial Inteligente da academia Be Fitness. Gere uma mensagem para um cliente.

${stage.title}
OBJETIVO: ${stage.goal}

${stage.techniques}

${COMMON_INFO}

Adapte ao perfil: ${profileLabel}

${historyText}

DADOS DO CLIENTE:
Nome: ${customer.name}
Perfil: ${profileLabel}
Objetivo: ${customer.objective || 'Não informado'}

Gere a melhor mensagem agora.`;
}
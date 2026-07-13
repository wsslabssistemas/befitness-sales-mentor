import { GYM_HOURS_TEXT } from '@/lib/gymHours';

export function getTrialDay(trialStartDate) {
  if (!trialStartDate) return null;
  const start = new Date(trialStartDate + 'T00:00:00');
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / 86400000);
}

export function getTrialInfo(trialStartDate, interactions = [], customerStatus) {
  if (!trialStartDate) return null;

  const day = getTrialDay(trialStartDate);
  const start = new Date(trialStartDate + 'T00:00:00');
  start.setHours(0, 0, 0, 0);

  const hasInteractionOnOrAfter = (daysAfterStart) => {
    const threshold = new Date(start);
    threshold.setDate(threshold.getDate() + daysAfterStart);
    return interactions.some(i => new Date(i.created_date) >= threshold);
  };

  const stages = [
    { id: 'inicio', label: 'Início', day: 0, done: true, due: true },
    { id: 'checkin', label: 'Acompanhamento', day: 2, done: hasInteractionOnOrAfter(2), due: day >= 2 },
    { id: 'preclose', label: 'Pré-fechamento', day: 6, done: hasInteractionOnOrAfter(5), due: day >= 6 },
    { id: 'conversao', label: 'Conversão', day: 8, done: customerStatus === 'matriculado', due: day >= 8 && customerStatus !== 'matriculado' },
  ];

  const currentStage = stages.find(s => !s.done && s.due) || null;

  return { day, stages, currentStageId: currentStage?.id || null };
}

export function getTrialAlert(customer) {
  if (customer.status !== 'semana_experimental' || !customer.trial_start_date) return null;

  const day = getTrialDay(customer.trial_start_date);
  if (day === null || day < 2) return null;

  const lastInt = customer.last_interaction_date ? new Date(customer.last_interaction_date) : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysSinceInteraction = lastInt
    ? Math.floor((now - new Date(lastInt.toDateString())) / 86400000)
    : 999;

  if (day >= 8 && daysSinceInteraction >= 2) return { type: 'conversao', day };
  if (day >= 6 && daysSinceInteraction >= 2) return { type: 'preclose', day };
  if (day >= 2 && daysSinceInteraction >= 2) return { type: 'checkin', day };
  return null;
}

export function buildTrialPrompt(stageId, customer, interactions = []) {
  const profileLabel = customer.profile || 'outro';

  const historyText = interactions.length > 0
    ? 'HISTÓRICO DE ATENDIMENTOS (não repita abordagens já usadas):\n' +
      interactions.slice(0, 5).map(i =>
        `- Resposta: ${i.suggested_response || 'N/A'} | Resultado: ${i.result || 'pendente'}`
      ).join('\n')
    : 'Sem atendimentos anteriores.';

  const stageConfigs = {
    checkin: {
      title: 'ACOMPANHAMENTO — Dia 2-3 da semana experimental',
      goal: 'O cliente está no 2º-3º dia da semana experimental. Verifique como está sendo a experiência, faça o cliente verbalizar o valor recebido e gere conexão emocional. NÃO fale de preços ainda.',
      techniques: `TÉCNICAS A APLICAR:
- Value Realization (Hormozi): faça o cliente dizer o que mais gostou, qual exercício, como está se sentindo
- Future Pacing (Brian Tracy): "Imagine daqui 3 semanas com mais disposição..."
- Puppy Dog Close (Brian Tracy): reforce que é sem compromisso — a experiência vende sozinha
- Hot Button (Tracy): descubra o que mais está motivando o cliente`,
    },
    preclose: {
      title: 'PRÉ-FECHAMENTO — Dia 6 da semana experimental',
      goal: 'O cliente está no final da semana experimental. Ancore o benefício emocional, apresente os planos e conduza para o fechamento.',
      techniques: `TÉCNICAS A APLICAR:
- Future Pacing (Tracy): faça o cliente refletir sobre o que mudou em 1 semana (disposição, energia)
- Three Tens (Belfort): construa certeza no Produto (estrutura), no Vendedor (você) e na Empresa
- Grand Slam Offer (Hormozi): empilhe valor — semana grátis + brinde + acompanhamento + estrutura completa
- Assumptive Close (Tracy): pergunte QUAL plano, não SE vai fechar`,
    },
    conversao: {
      title: 'CONVERSÃO PÓS-TRIAL — Trial encerrado',
      goal: 'A semana experimental encerrou e o cliente ainda não fechou. Converta usando urgência e loss aversion. Apresente os planos e peça o fechamento.',
      techniques: `TÉCNICAS A APLICAR:
- Loss Aversion (Kahneman): "A cada dia sem treinar, perde o ritmo que conquistou"
- Takeaway Close (Tracy): "A vaga da semana experimental está preenchida, não queria que perdesse"
- Now or Never (Tracy): crie deadline real
- Reduction to the Ridiculous (Tracy): "R$ 99/mês = R$ 3,30/dia, menos que um café"
- Always Ask One More Time (Cardone): persista, não desista no primeiro não`,
    },
  };

  const stage = stageConfigs[stageId];
  if (!stage) return null;

  return `Você é o Assistente Comercial Inteligente da academia Be Fitness. Gere uma mensagem de acompanhamento para um cliente na semana experimental.

${stage.title}
OBJETIVO: ${stage.goal}

${stage.techniques}

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
- Adapte ao perfil: ${profileLabel}
- A mensagem deve ser pronta para copiar e enviar no WhatsApp.

${historyText}

DADOS DO CLIENTE:
Nome: ${customer.name}
Perfil: ${profileLabel}
Objetivo: ${customer.objective || 'Não informado'}

Gere a melhor mensagem de acompanhamento agora.`;
}
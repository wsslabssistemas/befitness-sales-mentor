// Lógica compartilhada da automação proativa (simulação + envio aprovado).
import { detectStage } from './automationRules.ts';

export function detectPublic(c) {
  const source = (c.lead_source || '').toLowerCase();
  if (source.includes('totalpass') || source.includes('wellhub') || source.includes('convên') || source.includes('conveni')) {
    return 'convenio';
  }
  if (c.status === 'matriculado' || c.status === 'renovado') return 'matriculado';
  return 'sem_matricula';
}

export function countByPublic(tasks) {
  const counts = { sem_matricula: 0, convenio: 0, matriculado: 0 };
  for (const t of tasks) counts[t.publico] = (counts[t.publico] || 0) + 1;
  return counts;
}

// Constrói o mapa estágio → entrada da biblioteca "Relacionamento Ativo".
export async function buildStageMap(base44) {
  const categories = await base44.asServiceRole.entities.LibraryCategory.list();
  const relCat = categories.find((c) => (c.name || '').toLowerCase().includes('relacionamento'));
  let entries = [];
  if (relCat) {
    entries = await base44.asServiceRole.entities.LibraryEntry.filter({ category_id: relCat.id });
  }
  const findEntry = (kw) => entries.find((e) => (e.question || '').toLowerCase().includes(kw));
  const stageToEntry = {
    contato: findEntry('cliente sem matrícula'),
    descoberta: findEntry('cliente sem matrícula'),
    proposta: findEntry('cliente sem matrícula'),
    negociacao: findEntry('cliente sem matrícula'),
    trial: findEntry('cliente matriculado'),
    posvenda: findEntry('cliente matriculado'),
    retencao_30: findEntry('cliente matriculado'),
    retencao_45: findEntry('cliente matriculado'),
    retencao_60: findEntry('cliente matriculado'),
    retencao_90: findEntry('cliente matriculado'),
    reativacao: findEntry('cliente sem matrícula'),
    reativacao_90: findEntry('cliente sem matrícula'),
    reativacao_180: findEntry('cliente sem matrícula'),
    reativacao_365: findEntry('cliente sem matrícula'),
  };
  return { entries, stageToEntry };
}

// Monta o contexto (tarefa) de um cliente para a IA, buscando o histórico.
export async function buildTaskForCustomer(base44, customer, entries, stageToEntry) {
  const interactions = await base44.asServiceRole.entities.Interaction.filter(
    { customer_id: customer.id },
    '-created_date',
    5
  );
  const stage = detectStage(customer, new Date());
  const entry = stageToEntry[stage] || entries[0];
  const lastInt = interactions[0];
  return {
    customer_id: customer.id,
    customer_name: customer.name,
    phone: customer.phone || '',
    status: customer.status,
    estagio: stage,
    publico: detectPublic(customer),
    library_entry_id: entry?.id || '',
    library_question: entry?.question || '',
    base_answer: entry?.answer || '',
    technique: entry?.technique || '',
    objective: entry?.objective || '',
    ultima_mensagem: lastInt?.suggested_response || '',
    ultima_msg_cliente: lastInt?.conversation || '',
    ultimo_resultado: lastInt?.result || '',
    interactions,
  };
}

export function buildProactivePrompt(t) {
  return `Você é o Assistente Comercial da academia Be Fitness. Gere uma mensagem PROATIVA para um cliente (nós iniciamos o contato).

CONTEXTO DA JORNADA:
- Cliente: ${t.customer_name}
- Status atual: ${t.status}
- Estágio: ${t.estagio}
- Público: ${t.publico}

RÉGUA DA BIBLIOTECA (use como base):
- Pergunta: ${t.library_question}
- Resposta base: ${t.base_answer}
- Técnica: ${t.technique}
- Objetivo: ${t.objective}

${t.ultima_mensagem ? `ÚLTIMA MENSAGEM QUE ENVIAMOS a este cliente (NÃO repita a mesma abordagem — evolua a conversa):\n"${t.ultima_mensagem}"` : 'Ainda não enviamos nenhuma mensagem proativa a este cliente.'}

${t.ultima_msg_cliente ? `ÚLTIMA MENSAGEM DO CLIENTE:\n"${t.ultima_msg_cliente}"` : 'O cliente não respondeu à última mensagem.'}

${t.ultimo_resultado ? `Resultado do último contato: ${t.ultimo_resultado}` : ''}

REGRAS CRÍTICAS:
- Gere UMA mensagem curta, humana, pronta para copiar e enviar no WhatsApp.
- NÃO repita a abordagem da última mensagem enviada — evolua a conversa.
- Se o cliente não respondeu, use uma abordagem de follow-up (Takeaway, urgência, curiosidade).
- NUNCA use "o que acha?" — use Fechamento Pressuposto ou Alternativa.
- Seja simpático, use emojis com moderação.
- A academia é FORMATO LIVRE (sem reservas/vagas).
- Se o cliente NUNCA foi aluno, NÃO diga "voltar" ou "retornar".

Gere a mensagem agora.`;
}
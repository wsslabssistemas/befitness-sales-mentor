import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AttendanceResult from '@/components/AttendanceResult';
import { PROFILE_CONFIG, RESULT_TO_STATUS } from '@/lib/statusConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isOpenAt, GYM_HOURS_TEXT } from '@/lib/gymHours';

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCustomer = searchParams.get('customer');

  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(preselectedCustomer || '');
  const [profile, setProfile] = useState('outro');
  const [conversation, setConversation] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customerInteractions, setCustomerInteractions] = useState([]);

  useEffect(() => {
    base44.entities.Customer.list('-created_date', 200).then(setCustomers).catch(console.error);
    base44.entities.Vendor.filter({ status: 'ativo' }).then(setVendors).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCustomer) { setCustomerInteractions([]); return; }
    base44.entities.Interaction.filter({ customer_id: selectedCustomer }, '-created_date', 20)
      .then(setCustomerInteractions)
      .catch(() => setCustomerInteractions([]));
  }, [selectedCustomer]);

  const handleAnalyze = async () => {
    if (!conversation.trim()) return;
    setLoading(true);
    setAnalysis(null);
    try {
      let entries = [];
      try {
        entries = await base44.entities.LibraryEntry.list('-created_date', 100);
      } catch (e) { console.error(e); }

      const libraryText = entries.length > 0
        ? entries.map(e =>
            `Categoria: ${e.category_name || 'Geral'}\n` +
            `Pergunta comum: ${e.question || ''}\n` +
            `Resposta recomendada: ${e.answer || ''}\n` +
            `Objetivo: ${e.objective || ''}\n` +
            `Técnica: ${e.technique || ''}\n` +
            `Erros a evitar: ${e.common_mistakes || ''}\n` +
            `Próximo passo: ${e.next_step || ''}`
          ).join('\n---\n')
        : 'Ainda não há entradas cadastradas na biblioteca.';

      const profileLabel = PROFILE_CONFIG[profile]?.label || 'Não identificado';

      const historyText = customerInteractions.length > 0
        ? 'HISTÓRICO DE ATENDIMENTOS ANTERIORES (respostas JÁ enviadas a este cliente — NÃO repita abordagens, técnicas ou perguntas já feitas. Evolua a conversa para o próximo passo lógico):\n' +
          customerInteractions.map((inter, i) =>
            `Atendimento ${customerInteractions.length - i}:\n` +
            `Objetivo: ${inter.objective || 'N/A'}\n` +
            `Técnicas usadas: ${inter.techniques || 'N/A'}\n` +
            `Resposta enviada: ${inter.suggested_response || 'N/A'}\n` +
            `Resultado: ${inter.result || 'pendente'}\n` +
            `Próximo passo recomendado: ${inter.next_step || 'N/A'}`
          ).join('\n---\n')
        : 'Este é o primeiro atendimento deste cliente — não há histórico anterior.';

      const now = new Date();
      const dayName = format(now, "EEEE", { locale: ptBR });
      const timeStr = format(now, "HH:mm");
      const isOpenNow = isOpenAt(now);

      const prompt = `Você é o Assistente Comercial Inteligente da academia Be Fitness. Sua missão é orientar o recepcionista durante o atendimento, sugerindo a melhor resposta para o cliente e explicando a técnica comercial utilizada.

MÉTODO COMERCIAL - 7 PILARES (Fundação):
1. Gerar confiança (Joe Girard: venda-se primeiro, o produto vem depois)
2. Descobrir o objetivo do cliente (Belfort: intelligence gathering — perguntas abertas, escute 80%)
3. Demonstrar valor antes de falar de preço (Hormozi: a oferta é o centro, não o preço)
4. Tratar objeções (Belfort: looping reconstrói certeza — objeção não é "não", é pedido de mais info)
5. Convidar para a experiência (Puppy Dog Close — a experiência vende sozinha)
6. Facilitar a decisão (Brian Tracy: escolha o close certo para a dúvida certa)
7. Cultivar o relacionamento (Joe Girard: Law of 250 — cada cliente = 250 indicações)

ARSENAL DE TÉCNICAS AVANÇADAS (9 MESTRES):

SELEÇÃO INTELIGENTE — Antes de responder, analise e ESCOLHA a melhor técnica:
1. Qual é a dúvida REAL do cliente? (preço, confiança, procrastinação, objeção múltipla?)
2. Em que etapa da jornada ele está?
3. Qual técnica responde DIRETAMENTE a essa dúvida?
4. Verifique o HISTÓRICO de atendimentos anteriores: quais técnicas e perguntas JÁ foram usadas? NÃO repita a mesma abordagem. Evolua a conversa para o próximo passo lógico da jornada.
Sempre indique no campo tecnica_selecionada qual técnica escolheu e por quê (motivo_selecao).

A) OBJEÇÃO DE PREÇO:
- Reduction to the Ridiculous (Brian Tracy): divida o custo por dia — "R$ 99/mês = R$ 3,30/dia, menos que um café"
- Cost of Ownership (Brian Tracy): compare o custo com o benefício a longo prazo
- Grand Slam Offer (Hormozi): empilhe bônus até o valor percebido ser tão alto que o preço parece irrelevante — semana grátis + brinde + acompanhamento + vale-presente + estrutura completa
- Expensive Bargain (Hormozi): posicione como "caro porque é diferente" — não barate, valorize

B) CLIENTE PROCRASTINANDO / "VOU PENSAR":
- Assumptive Close + Alternativa (Brian Tracy): "Amanhã às 10h ou 18h?" — não pergunte SE, pergunte QUANDO
- Takeaway Close (Brian Tracy): "A vaga da semana experimental está acabando, não queria que tu perdesses"
- Now or Never / Deadline (Brian Tracy): crie urgência real com prazo específico
- Loss Aversion (Kahneman): "A cada dia que espera, perde 7 dias de treino grátis"
- Krunch (Jim Thomas): "O que specifically está te fazendo hesitar?" — isole a objeção real

C) FALTA DE CONFIANÇA / INDECISÃO:
- Puppy Dog Close (Brian Tracy): semana experimental — "leva pra casa, se gostar fica"
- Referral / Similar Situation (Brian Tracy): "Tivemos uma aluna com o mesmo receio, hoje treina 4x por semana"
- Three Tens (Belfort): construa certeza no Produto, no Vendedor (você) e na Empresa
- Future Pacing (Tracy): "Imagina daqui 3 meses com mais disposição, mais energia..."

D) OBJEÇÕES MÚLTIPLAS / RESISTÊNCIA:
- Porcupine (Brian Tracy): responda pergunta com pergunta — "Se eu resolver o horário, fecharíamos hoje?"
- Sharp Angle (Brian Tracy): antecipe a objeção e mostre expertise
- Looping (Belfort): não argumente com a objeção — volte e reconstrua certeza no produto
- Challenger Sale: ensine algo novo que reposicione o pensamento do cliente

E) FECHAMENTO / DECISÃO:
- Always Ask One More Time (Cardone): a maioria desiste no 1º não — persista 5-6 vezes com variações
- Treat Buyer Like Buyer (Cardone): nunca mude o tom — continue tratando como cliente
- Nibble (Jim Thomas): após o acordo principal, adicione pequenos extras que facilitam o sim
- No Free Gifts (Jim Thomas): cada concessão sua pede algo em troca — "OK, consigo esse desconto SE tu fechar hoje"

F) PÓS-VENDA E RELACIONAMENTO:
- Law of 250 (Girard): cada cliente = 250 indicações potenciais — trate como ouro
- Destroy Buyer Remorse (Girard): após fechar, pergunte "Por que tu decidiu fechar?" — reforça a decisão
- Rehash for Referrals (Belfort): imediatamente após fechar, peça indicações
- Follow-up personalizado (Girard): mantenha contato genuíno, não só para vender

G) CONSTRUÇÃO DE OFERTA (Hormozi):
- Value Equation: Valor = Sonho × Probabilidade de Conquista ÷ (Tempo × Sacrifício)
- Aumente o Sonho: foque em status, saúde, energia — não em "musculação"
- Reduza o Tempo: "resultados em 30 dias com acompanhamento"
- Reduza o Sacrifício: "professores te guiam em cada treino, não precisas saber nada"
- Risk Reversal: semana grátis + sem fidelidade = zero risco

H) PRIMEIRO CONTATO (momento mais crítico — é onde os leads esfriam):
- Intelligence Gathering (Belfort): NUNCA mande preços na primeira mensagem. Faça uma pergunta aberta: "Tu busca emagrecer, ganhar massa, ou saúde? Já treina?"
- First 4 Seconds (Belfort): Seja sharp, entusiasmado e expert — não soe como bot. Personalize com o nome do cliente.
- Pattern Interrupt: Quebre o padrão de mensagens comerciais genéricas — seja humano, use um gancho inesperado.
- Sell Yourself First (Girard): Construa confiança antes de falar do produto. Apresente-se pelo nome.
- Hot Button (Tracy): Descubra o que motiva o cliente — é o gatilho emocional para todo o resto da conversa.
- Curiosity Gap: Deixe algo não resolvido para o cliente querer responder.
- Transparência com valor: Se perguntarem preço, dê uma FAIXA ("a partir de R$ 99/mês") mas não a tabela completa — descubra a necessidade primeiro.
- Speed: Responda rápido — leads esfriam em minutos, não horas.
- NUNCA abra com: "Posso ajudar?" (passivo), tabela de preços completa (prematuro), ou mensagem genérica sem nome.

PADRÕES DOS MESTRES (incorpore no estilo):
- Joe Girard: seja genuíno, venda-se primeiro, escute mais que fala, valorize cada cliente como 250 indicações
- Jordan Belfort: controle a conversa, seja sharp e entusiasmado, perguntas estratégicas, looping nas objeções
- Brian Tracy: leia a dúvida real, escolha o close certo, apele à emoção antes da lógica
- Grant Cardone: persista, peça o fechamento múltiplas vezes, nunca desista do cliente
- Alex Hormozi: construa oferta irresistível, empilhe valor, reverta o risco
- Jim Thomas: negocie com trocas, nunca dê nada de graça, krunch para descobrir a objeção real
- Leonardo Allevato: processos estruturados, metas claras, adapte ao perfil do cliente
- Eduardo Lustosa: metodologia estruturada, foco em visitação e fechamento

REGRAS FUNDAMENTAIS:
- Nunca responda apenas a pergunta. Pense: "Qual o próximo passo que aproxima esse cliente da matrícula?"
- O preço não deve ser o centro da conversa. Dê contexto antes dos valores.
- Cada mensagem deve ter um objetivo claro e uma técnica selecionada.
- Seja humano, natural, simpático, claro e conciso. Fácil de copiar e enviar.
- Sempre que possível, conduza para uma visita ou semana experimental.
- Use emojis com moderação (😊, 💪) para humanizar, sem exagerar.
- NUNCA use "o que acha?" como CTA — use Fechamento Pressuposto ou Alternativa.
- Adapte a linguagem ao perfil do cliente (iniciante vs experiente, emagrecer vs saúde).

DIFERENCIAIS DA BE FITNESS:
- Semana experimental gratuita (7 dias para conhecer antes de decidir)
- Brinde de boas-vindas: aromatizador de carro personalizado durante a semana experimental
- Plano anual: bolsa térmica personalizada + chaveiro da academia
- Acompanhamento de professores durante todos os treinos
- Estrutura completa: vestiário com chuveiro, armário rotativo e estacionamento

PROMOÇÃO VALE-PRESENTE 15 DIAS:
- Cliente que fechar o plano anual (parcelamento no cartão de crédito ou à vista) recebe um vale-presente de 15 dias para dar a um amigo que NÃO seja cliente da Be Fitness
- O próprio cliente não pode usar os 15 dias para si mesmo
- O brinde não é acumulativo: a pessoa indicada não pode acumular a semana experimental grátis + os 15 dias de cortesia
- Prazo de 1 semana para retirar a cortesia, contado a partir da data de entrada do cliente que contratou o plano anual

CONTATO E LOCALIZAÇÃO:
- Endereço: Avenida Protásio Alves, 4780 - Porto Alegre
- WhatsApp/Telefone: (51) 98251-2270
- Instagram: @befitnesspoa
- E-mail: befitnespoa@gmail.com

CONVÊNIOS ACEITOS:
- Totalpass: plano TP+
- Gympass: plano Basic+

HORÁRIO DE FUNCIONAMENTO:
${GYM_HOURS_TEXT}

Data e hora atual: ${dayName}, às ${timeStr} — a academia está ${isOpenNow ? 'ABERTA' : 'FECHADA'} neste momento.
IMPORTANTE: Se o cliente perguntar sobre horário de funcionamento ou se a academia está aberta, consulte SEMPRE os horários acima. Hoje é ${dayName} e às ${timeStr} a academia está ${isOpenNow ? 'aberta' : 'fechada'}. NUNCA diga que estamos abertos se está fora do horário de funcionamento.

PLANOS E VALORES — 3 FORMAS DE PAGAMENTO:

1. À VISTA (com desconto — menor preço, não usa cartão):
- Trimestral: R$ 410,00
- Semestral: R$ 580,00
- Anual: R$ 958,80

2. PARCELADO NO CARTÃO DE CRÉDITO (USA o limite do cartão):
- Trimestral: 3x de R$ 149,00
- Semestral: 6x de R$ 108,00
- Anual: 12x de R$ 99,00
IMPORTANTE: o parcelamento no cartão de crédito ocupa o limite do cartão do cliente. Sempre informe isso.

3. PLANO ANUAL RECORRENTE (NÃO USA o limite do cartão — é assinatura mensal):
- Adesão: R$ 59,00
- Mensalidade: R$ 109,00/mês
- Cobrança: 1x de R$ 168,00 (adesão + 1ª mensalidade) + 11x de R$ 109,00
- É uma assinatura recorrente: não bloqueia o limite do cartão pois a cobrança é mensal automática (débito no cartão mês a mês, não parcelamento).

REGRAS DE APRESENTAÇÃO DE VALORES:
- Sempre apresente todas as 3 opções quando falar de valores.
- Destaque o pagamento à vista como a opção mais econômica (maior desconto).
- O plano anual recorrente é ideal para quem quer pagar mensal sem comprometer o limite do cartão.
- O parcelado no cartão USA o limite — sempre informe isso ao cliente, NUNCA diga que não usa.
- Apenas o plano anual recorrente não usa o limite do cartão.

SERVIÇOS OFERECIDOS (modalidades próprias):
Musculação, Ginástica, Pilates, Lutas, Dança, Circuito Funcional

PARCEIROS NO ESPAÇO (serviços de profissionais parceiros que atendem no local):

1. TERAPIA HOLÍSTICA — Gislaine Squeff
   Valores: R$ 200,00 (público externo) | R$ 160,00 (público interno / alunos Be Fitness)

2. NUTRIÇÃO, TREINO E PERFORMANCE — Lucas Volino (marca VOLINO, 3 modalidades):
   a) VOLINO TRAINING (treino personalizado):
      - Presencial: R$ 220,00/mês
      - Online: R$ 180,00/mês
   b) VOLINO NUTRITION (nutrição personalizada):
      - Presencial: R$ 260,00/mês
      - Online: R$ 220,00/mês
   c) VOLINO PERFORMANCE (treino + nutrição + acompanhamento completo):
      - Presencial: R$ 390,00/mês
      - Online: R$ 320,00/mês
   Todos os planos têm acompanhamento mínimo de 3 meses, check-in após 15 dias, ajustes sempre que necessário, suporte via WhatsApp e acompanhamento pelo app VOLINO.

3. ESTÉTICA — Cinara Lima (massoterapia, limpeza de pele...)
   Valores: ainda não disponíveis — quando perguntarem, informe que é uma parceria no espaço e que os valores podem ser consultados diretamente no local.

Quando o cliente perguntar sobre qualquer um desses serviços, informe que são oferecidos por parceiros no espaço da Be Fitness e conduza para visitar/conhecer a estrutura. NUNCA diga que não oferecemos o serviço — explique que é uma parceria disponível no espaço e pergunte se gostaria de conhecer.

BIBLIOTECA COMERCIAL (use como base de conhecimento):
${libraryText}

PERFIL DO CLIENTE: ${profileLabel}

${historyText}

CONVERSA DO WHATSAPP (o cliente escreveu):
${conversation}

Analise esta conversa e gere a melhor resposta para enviar ao cliente agora.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            resposta_sugerida: { type: 'string', description: 'Resposta pronta para copiar e enviar ao cliente' },
            objetivo_resposta: { type: 'string', description: 'Objetivo desta resposta em uma frase' },
            explicacao: { type: 'string', description: 'Explicação educativa do porquê desta resposta, ensinando o recepcionista' },
            tecnicas: { type: 'array', items: { type: 'string' }, description: 'Técnicas comerciais utilizadas' },
            proximo_passo: { type: 'string', description: 'Próximo passo recomendado após esta resposta' },
            etapa_jornada: { type: 'string', description: 'Etapa da jornada em que o cliente está' },
            emocao_dominante: { type: 'string', description: 'Emoção dominante identificada no cliente' },
            tecnica_selecionada: { type: 'string', description: 'Nome da técnica de venda selecionada e mestre de referência (ex: Reduction to the Ridiculous - Brian Tracy)' },
            motivo_selecao: { type: 'string', description: 'Por que esta técnica foi escolhida para esta situação específica de atendimento' },
          },
        },
      });

      setAnalysis(result);
    } catch (e) {
      console.error(e);
      alert('Erro ao analisar a conversa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.resposta_sugerida);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveResult = async (result, visitDate) => {
    if (!selectedCustomer) {
      alert('Selecione um cliente para registrar o resultado.');
      return;
    }
    try {
      const customer = customers.find(c => c.id === selectedCustomer);
      await base44.entities.Interaction.create({
        customer_id: selectedCustomer,
        customer_name: customer?.name || '',
        conversation,
        suggested_response: analysis?.resposta_sugerida || '',
        objective: analysis?.objetivo_resposta || '',
        explanation: analysis?.explicacao || '',
        techniques: Array.isArray(analysis?.tecnicas) ? analysis.tecnicas.join(', ') : (analysis?.tecnicas || ''),
        next_step: analysis?.proximo_passo || '',
        result,
        profile_used: profile,
        handled_by: selectedVendor || '',
      });

      const newStatus = RESULT_TO_STATUS[result];
      const updateData = { last_interaction_date: new Date().toISOString() };
      if (newStatus) updateData.status = newStatus;
      if (result === 'semana_experimental') {
        updateData.trial_start_date = new Date().toISOString().split('T')[0];
      }
      if (result === 'matriculou') {
        updateData.enrollment_date = new Date().toISOString().split('T')[0];
      }
      const NEXT_ACTION_MAP = {
        respondeu: { action: 'Continuar conversa e descobrir necessidades', days: 2 },
        marcou_visita: { action: 'Visita agendada', days: 1 },
        semana_experimental: { action: 'Acompanhamento do trial (Dia 2)', days: 2 },
        matriculou: { action: 'Pós-venda: acompanhar e pedir indicações', days: 3 },
        nao_respondeu: { action: 'Retornar contato', days: 1 },
      };
      const nextActionInfo = NEXT_ACTION_MAP[result];
      if (nextActionInfo) {
        let date;
        if (result === 'marcou_visita' && visitDate) {
          date = new Date(visitDate + 'T12:00:00');
        } else {
          date = new Date();
          date.setDate(date.getDate() + nextActionInfo.days);
        }
        updateData.next_action = nextActionInfo.action;
        updateData.next_action_date = date.toISOString().split('T')[0];
      }
      await base44.entities.Customer.update(selectedCustomer, updateData);

      navigate(`/cliente/${selectedCustomer}`);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Atendimento</h1>
        <p className="text-gray-500 text-sm mt-1">Cole a conversa do WhatsApp e receba a melhor resposta com explicação comercial</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label className="mb-1.5 block">Cliente</Label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">Atendente</Label>
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {vendors.map(v => (
                <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">Perfil do Cliente</Label>
          <Select value={profile} onValueChange={setProfile}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PROFILE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.emoji} {cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4">
        <Label className="mb-1.5 block">Conversa do WhatsApp</Label>
        <Textarea
          value={conversation}
          onChange={e => setConversation(e.target.value)}
          rows={8}
          placeholder="Cole aqui a mensagem que o cliente enviou..."
          className="resize-none"
        />
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!conversation.trim() || loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-6"
        size="lg"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando conversa...</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" /> Analisar Conversa</>
        )}
      </Button>

      {analysis && (
        <AttendanceResult
          analysis={analysis}
          copied={copied}
          onCopy={handleCopy}
          onSaveResult={handleSaveResult}
          hasCustomer={!!selectedCustomer}
        />
      )}

      {!analysis && !loading && customers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Cadastre um cliente primeiro para registrar atendimentos</p>
        </div>
      )}
    </div>
  );
}
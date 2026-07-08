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

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCustomer = searchParams.get('customer');

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(preselectedCustomer || '');
  const [profile, setProfile] = useState('outro');
  const [conversation, setConversation] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.entities.Customer.list('-created_date', 200).then(setCustomers).catch(console.error);
  }, []);

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

      const prompt = `Você é o Assistente Comercial Inteligente da academia Be Fitness. Sua missão é orientar o recepcionista durante o atendimento, sugerindo a melhor resposta para o cliente e explicando a técnica comercial utilizada.

MÉTODO COMERCIAL - 7 PILARES:
1. Gerar confiança
2. Descobrir o objetivo do cliente
3. Demonstrar valor antes de falar de preço
4. Tratar objeções (não são "não", são pedidos de mais informação)
5. Convidar para a experiência (semana experimental gratuita)
6. Facilitar a decisão sem pressão
7. Cultivar o relacionamento

REGRAS FUNDAMENTAIS:
- Nunca responda apenas a pergunta. Pense: "Qual o próximo passo que aproxima esse cliente da matrícula?"
- O preço não deve ser o centro da conversa. Dê contexto antes dos valores.
- Cada mensagem deve ter um objetivo claro.
- Seja humano, natural, simpático, claro e conciso. Fácil de copiar e enviar.
- Sempre que possível, conduza para uma visita ou semana experimental.
- Use emojis com moderação (😊, 💪) para humanizar, sem exagerar.

DIFERENCIAIS DA BE FITNESS:
- Semana experimental gratuita (7 dias para conhecer antes de decidir)
- Brinde de boas-vindas: aromatizador de carro personalizado durante a semana experimental
- Plano anual: bolsa térmica personalizada + chaveiro da academia
- Acompanhamento de professores durante todos os treinos

SERVIÇOS OFERECIDOS:
Musculação, Ginástica, Pilates, Lutas, Dança, Circuito Funcional

BIBLIOTECA COMERCIAL (use como base de conhecimento):
${libraryText}

PERFIL DO CLIENTE: ${profileLabel}

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

  const handleSaveResult = async (result) => {
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
      });

      const newStatus = RESULT_TO_STATUS[result];
      const updateData = { last_interaction_date: new Date().toISOString() };
      if (newStatus) updateData.status = newStatus;
      const NEXT_ACTION_MAP = {
        respondeu: { action: 'Continuar conversa e descobrir necessidades', days: 2 },
        marcou_visita: { action: 'Confirmar visita', days: 1 },
        semana_experimental: { action: 'Acompanhar experiência', days: 3 },
        matriculou: { action: 'Acompanhar primeiros treinos', days: 2 },
        nao_respondeu: { action: 'Retornar contato', days: 1 },
      };
      const nextActionInfo = NEXT_ACTION_MAP[result];
      if (nextActionInfo) {
        const date = new Date();
        date.setDate(date.getDate() + nextActionInfo.days);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
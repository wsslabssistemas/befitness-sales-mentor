import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getTrialInfo, buildTrialPrompt } from '@/lib/trialJourney';
import { Loader2, Copy, Check, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STAGE_META = {
  inicio: { label: 'Início', subtitle: 'Trial iniciado', icon: '🎯' },
  checkin: { label: 'Acompanhamento', subtitle: 'Dia 2-3', icon: '👋' },
  preclose: { label: 'Pré-fechamento', subtitle: 'Dia 6', icon: '💪' },
  conversao: { label: 'Conversão', subtitle: 'Dia 8+', icon: '🏆' },
};

const STAGE_DESCRIPTIONS = {
  checkin: 'Verifique como está sendo a experiência, faça o cliente verbalizar o valor e gere conexão emocional.',
  preclose: 'Ancore os benefícios da semana, apresente os planos e conduza para o fechamento.',
  conversao: 'Use urgência e loss aversion para converter o visitante em aluno.',
};

export default function TrialJourney({ customer, interactions, onSaved }) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const info = getTrialInfo(customer.trial_start_date, interactions, customer.status);
  if (!info) return null;

  const currentStage = info.stages.find(s => s.id === info.currentStageId);
  const isCompleted = customer.status === 'matriculado';

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const prompt = buildTrialPrompt(info.currentStageId, customer, interactions);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            resposta_sugerida: { type: 'string' },
            tecnica_utilizada: { type: 'string' },
            explicacao: { type: 'string' },
          },
        },
      });
      setMessage(result);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar mensagem. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.resposta_sugerida);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Interaction.create({
        customer_id: customer.id,
        customer_name: customer.name,
        conversation: '[Mensagem de acompanhamento do trial gerada pelo sistema]',
        suggested_response: message.resposta_sugerida,
        objective: STAGE_META[info.currentStageId]?.label || 'Acompanhamento',
        explanation: message.explicacao || '',
        techniques: message.tecnica_utilizada || '',
        result: 'pendente',
        profile_used: customer.profile || 'outro',
      });
      await base44.entities.Customer.update(customer.id, {
        last_interaction_date: new Date().toISOString(),
      });
      setMessage(null);
      if (onSaved) onSaved();
    } catch (e) {
      console.error(e);
      alert('Erro ao registrar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900">Jornada da Semana Experimental</h2>
        <span className="text-sm font-medium text-gray-400">Dia {info.day}</span>
      </div>

      <div className="flex items-start">
        {info.stages.map((stage, i) => {
          const meta = STAGE_META[stage.id];
          const isDone = stage.done;
          const isCurrent = stage.id === info.currentStageId && !isCompleted;
          return (
            <div key={stage.id} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                  isDone ? 'bg-green-500 border-green-500 text-white' :
                  isCurrent ? 'bg-orange-500 border-orange-500 text-white animate-pulse' :
                  'bg-gray-50 border-gray-200 text-gray-300'
                }`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : meta.icon}
                </div>
                <div className="text-center min-w-[64px]">
                  <p className={`text-xs font-medium ${isDone ? 'text-green-600' : isCurrent ? 'text-orange-600' : 'text-gray-400'}`}>
                    {meta.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{meta.subtitle}</p>
                </div>
              </div>
              {i < info.stages.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mt-5 rounded transition-colors ${
                  info.stages[i + 1].done || isDone ? 'bg-green-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {currentStage && !isCompleted && (
        <div className="mt-5 bg-orange-50/50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-medium text-gray-700">{STAGE_META[currentStage.id].label} — {STAGE_META[currentStage.id].subtitle}</p>
          </div>
          <p className="text-sm text-gray-500 mb-3">{STAGE_DESCRIPTIONS[currentStage.id]}</p>
          <Button onClick={handleGenerate} disabled={generating} className="bg-orange-500 hover:bg-orange-600">
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Gerar mensagem de acompanhamento</>}
          </Button>
        </div>
      )}

      {message && (
        <div className="mt-4 space-y-3">
          <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
            <p className="text-xs text-orange-600 mb-1.5 font-medium">Mensagem sugerida</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.resposta_sugerida}</p>
          </div>
          {message.tecnica_utilizada && (
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-600">Técnica:</span>
              <span>{message.tecnica_utilizada}</span>
            </div>
          )}
          {message.explicacao && (
            <p className="text-xs text-gray-400 italic">{message.explicacao}</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <><Check className="w-4 h-4 mr-1.5" /> Copiado!</> : <><Copy className="w-4 h-4 mr-1.5" /> Copiar mensagem</>}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
              Registrar envio
            </Button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="mt-4 bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <p className="text-sm text-green-700 font-medium">🎉 Cliente matriculado! Jornada concluída com sucesso.</p>
        </div>
      )}
    </div>
  );
}
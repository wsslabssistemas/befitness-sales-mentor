import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { buildStagePrompt } from '@/lib/customerJourney';
import { Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JourneyMessage({ stageId, stageLabel, customer, interactions, onSaved }) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!stageId) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const prompt = buildStagePrompt(stageId, customer, interactions);
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
        conversation: '[Mensagem de acompanhamento gerada pelo sistema]',
        suggested_response: message.resposta_sugerida,
        objective: stageLabel || 'Acompanhamento',
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
    <div>
      <Button onClick={handleGenerate} disabled={generating} className="bg-orange-500 hover:bg-orange-600">
        {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Gerar mensagem de {stageLabel.toLowerCase()}</>}
      </Button>

      {message && (
        <div className="mt-4 space-y-3">
          <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
            <p className="text-xs text-orange-400 mb-1.5 font-medium">Mensagem sugerida</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{message.resposta_sugerida}</p>
          </div>
          {message.tecnica_utilizada && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-muted-foreground">Técnica:</span>
              <span>{message.tecnica_utilizada}</span>
            </div>
          )}
          {message.explicacao && (
            <p className="text-xs text-muted-foreground italic">{message.explicacao}</p>
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
    </div>
  );
}
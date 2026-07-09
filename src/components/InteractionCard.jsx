import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RESULT_CONFIG, RESULT_TO_STATUS } from '@/lib/statusConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

const NEXT_ACTION_MAP = {
  respondeu: { action: 'Continuar conversa e descobrir necessidades', days: 2 },
  marcou_visita: { action: 'Confirmar visita', days: 1 },
  semana_experimental: { action: 'Acompanhar experiência', days: 3 },
  matriculou: { action: 'Acompanhar primeiros treinos', days: 2 },
  nao_respondeu: { action: 'Retornar contato', days: 1 },
};

export default function InteractionCard({ interaction, onUpdated }) {
  const [updating, setUpdating] = useState(false);
  const cfg = RESULT_CONFIG[interaction.result] || RESULT_CONFIG.pendente;
  const date = interaction.created_date ? new Date(interaction.created_date) : null;

  const handleResultChange = async (e) => {
    const newResult = e.target.value;
    if (newResult === interaction.result) return;
    setUpdating(true);
    try {
      await base44.entities.Interaction.update(interaction.id, { result: newResult });
      const newStatus = RESULT_TO_STATUS[newResult];
      if (newStatus && interaction.customer_id) {
        const updateData = { last_interaction_date: new Date().toISOString(), status: newStatus };
        const nextActionInfo = NEXT_ACTION_MAP[newResult];
        if (nextActionInfo) {
          const d = new Date();
          d.setDate(d.getDate() + nextActionInfo.days);
          updateData.next_action = nextActionInfo.action;
          updateData.next_action_date = d.toISOString().split('T')[0];
        }
        await base44.entities.Customer.update(interaction.customer_id, updateData);
      }
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 text-sm min-w-0">
          {date && <span className="text-gray-500 whitespace-nowrap">{format(date, "dd 'de' MMMM", { locale: ptBR })}</span>}
          {interaction.handled_by && <span className="text-gray-400 truncate">• {interaction.handled_by}</span>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {updating && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
          <select
            value={interaction.result}
            onChange={handleResultChange}
            disabled={updating}
            className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer font-medium ${cfg.badge} disabled:opacity-50`}
            title="Editar status do atendimento"
          >
            {Object.entries(RESULT_CONFIG).map(([key, c]) => (
              <option key={key} value={key}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      {interaction.conversation && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-1">Conversa do cliente</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{interaction.conversation}</p>
        </div>
      )}
      {interaction.suggested_response && (
        <div className="mb-3 bg-orange-50/50 rounded-lg p-3">
          <p className="text-xs text-orange-600 mb-1">Resposta enviada</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{interaction.suggested_response}</p>
        </div>
      )}
      {interaction.explanation && (
        <p className="text-xs text-gray-400 italic">{interaction.explanation}</p>
      )}
    </div>
  );
}
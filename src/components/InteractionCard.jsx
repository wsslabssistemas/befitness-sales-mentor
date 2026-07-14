import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RESULT_CONFIG, RESULT_TO_STATUS } from '@/lib/statusConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Calendar } from 'lucide-react';

const NEXT_ACTION_MAP = {
  respondeu: { action: 'Continuar conversa e descobrir necessidades', days: 2 },
  marcou_visita: { action: 'Visita agendada', days: 1 },
  semana_experimental: { action: 'Acompanhamento do trial (Dia 2)', days: 2 },
  matriculou: { action: 'Pós-venda: acompanhar e pedir indicações', days: 3 },
  nao_respondeu: { action: 'Retornar contato', days: 1 },
};

export default function InteractionCard({ interaction, onUpdated }) {
  const [updating, setUpdating] = useState(false);
  const [pendingVisit, setPendingVisit] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const cfg = RESULT_CONFIG[interaction.result] || RESULT_CONFIG.pendente;
  const date = interaction.created_date ? new Date(interaction.created_date) : null;

  const doSave = async (newResult, customDate) => {
    setUpdating(true);
    setPendingVisit(false);
    try {
      await base44.entities.Interaction.update(interaction.id, { result: newResult });
      const newStatus = RESULT_TO_STATUS[newResult];
      if (newStatus && interaction.customer_id) {
        const updateData = { last_interaction_date: new Date().toISOString(), status: newStatus };
        if (newResult === 'semana_experimental') {
          updateData.trial_start_date = new Date().toISOString().split('T')[0];
        }
        if (newResult === 'matriculou') {
          updateData.enrollment_date = new Date().toISOString().split('T')[0];
        }
        if (newResult === 'desistiu') {
          updateData.lost_date = new Date().toISOString().split('T')[0];
        }
        const nextActionInfo = NEXT_ACTION_MAP[newResult];
        if (nextActionInfo) {
          let d;
          if (customDate) {
            d = new Date(customDate + 'T12:00:00');
          } else {
            d = new Date();
            d.setDate(d.getDate() + nextActionInfo.days);
          }
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

  const handleResultChange = (e) => {
    const newResult = e.target.value;
    if (newResult === interaction.result) return;
    if (newResult === 'marcou_visita') {
      setPendingVisit(true);
      return;
    }
    doSave(newResult);
  };

  const handleVisitConfirm = () => {
    if (!visitDate) return;
    doSave('marcou_visita', visitDate);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 text-sm min-w-0">
          {date && <span className="text-muted-foreground whitespace-nowrap">{format(date, "dd 'de' MMMM", { locale: ptBR })}</span>}
          {interaction.handled_by && <span className="text-muted-foreground truncate">• {interaction.handled_by}</span>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {updating && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
          <select
            value={interaction.result}
            onChange={handleResultChange}
            disabled={updating || pendingVisit}
            className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer font-medium ${cfg.badge} disabled:opacity-50`}
            title="Editar status do atendimento"
          >
            {Object.entries(RESULT_CONFIG).map(([key, c]) => (
              <option key={key} value={key}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      {pendingVisit && (
        <div className="mb-3 bg-orange-500/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-400" /> Para qual dia agendou a visita?
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border text-sm flex-1 min-w-[140px]"
              autoFocus
            />
            <button
              onClick={handleVisitConfirm}
              disabled={!visitDate}
              className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              onClick={() => { setPendingVisit(false); setVisitDate(''); }}
              className="px-2 py-1.5 text-xs text-muted-foreground hover:text-muted-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {interaction.conversation && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">Conversa do cliente</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interaction.conversation}</p>
        </div>
      )}
      {interaction.suggested_response && (
        <div className="mb-3 bg-orange-500/10 rounded-lg p-3">
          <p className="text-xs text-orange-400 mb-1">Resposta enviada</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{interaction.suggested_response}</p>
        </div>
      )}
      {interaction.explanation && (
        <p className="text-xs text-muted-foreground italic">{interaction.explanation}</p>
      )}
    </div>
  );
}
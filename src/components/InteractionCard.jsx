import { RESULT_CONFIG } from '@/lib/statusConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InteractionCard({ interaction }) {
  const cfg = RESULT_CONFIG[interaction.result] || RESULT_CONFIG.pendente;
  const date = interaction.created_date ? new Date(interaction.created_date) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm">
          {date && <span className="text-gray-500">{format(date, "dd 'de' MMMM", { locale: ptBR })}</span>}
          {interaction.handled_by && <span className="text-gray-400">• {interaction.handled_by}</span>}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
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
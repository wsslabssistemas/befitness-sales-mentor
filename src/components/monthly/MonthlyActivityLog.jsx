import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { RESULT_CONFIG } from '@/lib/statusConfig';

export default function MonthlyActivityLog({ interactions }) {
  const sorted = [...interactions].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-orange-500" />
        <p className="font-semibold text-gray-900">Registro de Atividades</p>
        <span className="text-xs text-gray-400 ml-auto">{interactions.length} atendimentos</span>
      </div>
      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Nenhuma atividade neste período</p>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {sorted.map(i => {
            const cfg = RESULT_CONFIG[i.result] || RESULT_CONFIG.pendente;
            return (
              <div key={i.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 text-sm">
                <span className="text-xs text-gray-400 w-16 flex-shrink-0">
                  {format(new Date(i.created_date), 'dd/MM HH:mm')}
                </span>
                <span className="font-medium text-gray-700 flex-1 truncate">{i.customer_name || '—'}</span>
                <span className="text-xs text-gray-400 hidden sm:inline w-24 truncate">{i.handled_by || '—'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
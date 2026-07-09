import { Users, Trophy, Trash2 } from 'lucide-react';

export default function SellerReport({ interactions, customers, onDelete }) {
  const sellers = {};
  const get = (name) => {
    if (!sellers[name]) sellers[name] = { name, interactions: 0, matriculas: 0, visitas: 0, experimentais: 0, assigned: 0, overdue: 0 };
    return sellers[name];
  };

  interactions.forEach(i => {
    if (!i.handled_by) return;
    const s = get(i.handled_by);
    s.interactions++;
    if (i.result === 'matriculou') s.matriculas++;
    if (i.result === 'marcou_visita') s.visitas++;
    if (i.result === 'semana_experimental') s.experimentais++;
  });

  const now = new Date(); now.setHours(0, 0, 0, 0);
  customers.forEach(c => {
    if (!c.assigned_to) return;
    const s = get(c.assigned_to);
    s.assigned++;
    if (c.next_action_date && new Date(c.next_action_date) < now && c.status !== 'matriculado' && c.status !== 'perdido') {
      s.overdue++;
    }
  });

  const list = Object.values(sellers).sort((a, b) => b.interactions - a.interactions);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-orange-500" />
        <p className="font-semibold text-gray-900">Performance por Vendedor</p>
      </div>
      {list.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Nenhum atendente registrou interações ainda</p>
      ) : (
        <div className="space-y-3">
          {list.map(s => {
            const rate = s.interactions > 0 ? ((s.matriculas / s.interactions) * 100).toFixed(0) : 0;
            return (
              <div key={s.name} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 group">
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${s.name}" do relatório de performance?\n\nOs atendimentos e clientes vinculados a este nome ficarão sem vendedor. O histórico dos clientes é mantido.`)) onDelete(s.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                    title="Remover do relatório"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{s.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                    <span>{s.interactions} atend.</span>
                    <span className="text-orange-600">{s.visitas} visitas</span>
                    <span className="text-purple-600">{s.experimentais} trials</span>
                    {s.overdue > 0 && <span className="text-red-600 font-medium">{s.overdue} atrasados</span>}
                    <span className="text-gray-400">{s.assigned} clientes</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Trophy className="w-4 h-4 text-orange-500" />
                    <span className="text-xl font-bold text-gray-900">{s.matriculas}</span>
                  </div>
                  <p className="text-xs text-gray-400">{rate}% conversão</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
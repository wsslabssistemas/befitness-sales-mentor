import { Filter } from 'lucide-react';

const FUNNEL_STAGES = [
  { key: 'novo_contato', label: 'Novo Contato', color: 'bg-blue-400' },
  { key: 'descobrindo_necessidade', label: 'Descoberta', color: 'bg-cyan-400' },
  { key: 'proposta_enviada', label: 'Proposta', color: 'bg-amber-400' },
  { key: 'semana_experimental', label: 'Trial', color: 'bg-purple-400' },
  { key: 'negociacao', label: 'Negociação', color: 'bg-orange-400' },
  { key: 'matriculado', label: 'Matriculado', color: 'bg-green-500' },
];

export default function SalesFunnel({ customers }) {
  const counts = FUNNEL_STAGES.map(stage => ({
    ...stage,
    count: customers.filter(c => c.status === stage.key).length,
  }));
  const maxCount = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-orange-500" />
        <p className="font-semibold text-gray-900">Funil de Vendas</p>
      </div>
      <div className="space-y-2">
        {counts.map((stage, i) => {
          const widthPct = (stage.count / maxCount) * 100;
          const prevCount = i > 0 ? counts[i - 1].count : stage.count;
          const dropoff = prevCount > 0 ? ((1 - stage.count / prevCount) * 100).toFixed(0) : 0;
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{stage.label}</span>
              <div className="flex-1">
                <div className={`${stage.color} h-8 rounded-lg flex items-center px-3 transition-all`} style={{ width: `${Math.max(widthPct, 10)}%` }}>
                  <span className="text-sm font-bold text-white">{stage.count}</span>
                </div>
              </div>
              {i > 0 ? (
                <span className={`text-xs flex-shrink-0 w-10 text-right ${stage.count < prevCount ? 'text-red-400' : 'text-gray-300'}`}>
                  {stage.count < prevCount ? `-${dropoff}%` : '—'}
                </span>
              ) : (
                <span className="w-10 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
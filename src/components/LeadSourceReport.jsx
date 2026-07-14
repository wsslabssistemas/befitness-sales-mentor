import { BarChart3 } from 'lucide-react';

export default function LeadSourceReport({ customers }) {
  const sources = {};
  customers.forEach(c => {
    const key = c.lead_source || 'Não informado';
    if (!sources[key]) sources[key] = { source: key, total: 0, matriculados: 0, experimentais: 0, ativos: 0 };
    sources[key].total++;
    if (c.status === 'matriculado') sources[key].matriculados++;
    else if (c.status === 'semana_experimental') sources[key].experimentais++;
    else if (c.status !== 'perdido') sources[key].ativos++;
  });

  const list = Object.values(sources).sort((a, b) => b.total - a.total);

  if (list.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-orange-500" />
        <p className="font-semibold text-foreground">Conversão por Origem</p>
      </div>
      <div className="space-y-4">
        {list.map(s => {
          const rate = s.total > 0 ? ((s.matriculados / s.total) * 100).toFixed(0) : 0;
          const matPct = s.total > 0 ? (s.matriculados / s.total) * 100 : 0;
          const trialPct = s.total > 0 ? (s.experimentais / s.total) * 100 : 0;
          const activePct = s.total > 0 ? (s.ativos / s.total) * 100 : 0;
          return (
            <div key={s.source}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{s.source}</span>
                <span className="text-xs text-muted-foreground">
                  {s.total} clientes • {s.matriculados} matr. ({rate}%)
                </span>
              </div>
              <div className="flex gap-0.5 h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="bg-orange-500" style={{ width: `${matPct}%` }} />
                <div className="bg-purple-400" style={{ width: `${trialPct}%` }} />
                <div className="bg-blue-300" style={{ width: `${activePct}%` }} />
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Matriculados</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Trial</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-300" /> Em atendimento</span>
        </div>
      </div>
    </div>
  );
}
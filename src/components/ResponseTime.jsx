import { Clock } from 'lucide-react';

export default function ResponseTime({ customers, interactions }) {
  const firstByCustomer = {};
  interactions.forEach(i => {
    if (!firstByCustomer[i.customer_id] || new Date(i.created_date) < new Date(firstByCustomer[i.customer_id].created_date)) {
      firstByCustomer[i.customer_id] = i;
    }
  });

  const times = customers.map(c => {
    const first = firstByCustomer[c.id];
    if (!first) return null;
    const hours = (new Date(first.created_date) - new Date(c.created_date)) / (1000 * 60 * 60);
    return hours >= 0 ? hours : null;
  }).filter(t => t !== null);

  if (times.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-orange-500" />
          <p className="font-semibold text-foreground">Tempo de Resposta</p>
        </div>
        <p className="text-center text-muted-foreground py-8 text-sm">Sem dados de atendimento ainda</p>
      </div>
    );
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const fast = times.filter(t => t < 1).length;
  const sameDay = times.filter(t => t >= 1 && t < 24).length;
  const slow = times.filter(t => t >= 24).length;

  const fmt = (h) => h < 1 ? `${Math.round(h * 60)} min` : h < 24 ? `${h.toFixed(1)}h` : `${Math.round(h / 24)}d`;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-orange-500" />
        <p className="font-semibold text-foreground">Tempo de Resposta</p>
      </div>
      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-foreground">{fmt(avg)}</p>
        <p className="text-sm text-muted-foreground">tempo médio até 1º atendimento</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-500/10 rounded-lg p-2">
          <p className="text-lg font-bold text-green-400">{fast}</p>
          <p className="text-xs text-muted-foreground">&lt; 1h</p>
        </div>
        <div className="bg-amber-500/10 rounded-lg p-2">
          <p className="text-lg font-bold text-amber-400">{sameDay}</p>
          <p className="text-xs text-muted-foreground">no dia</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-2">
          <p className="text-lg font-bold text-red-400">{slow}</p>
          <p className="text-xs text-muted-foreground">&gt; 1 dia</p>
        </div>
      </div>
    </div>
  );
}
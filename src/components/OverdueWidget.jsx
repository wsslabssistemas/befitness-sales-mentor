import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock } from 'lucide-react';

export default function OverdueWidget({ customers }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const fiveDaysAgo = new Date(today); fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const overdue = useMemo(() => {
    return customers.filter(c => {
      if (c.status === 'matriculado' || c.status === 'perdido') return false;
      if (!c.next_action_date) return false;
      return new Date(c.next_action_date) < today;
    });
  }, [customers, today]);

  const stale = useMemo(() => {
    const overdueIds = new Set(overdue.map(c => c.id));
    return customers.filter(c => {
      if (c.status === 'matriculado' || c.status === 'perdido') return false;
      if (overdueIds.has(c.id)) return false;
      const lastDate = c.last_interaction_date ? new Date(c.last_interaction_date) : new Date(c.created_date || 0);
      return lastDate < fiveDaysAgo;
    });
  }, [customers, overdue, fiveDaysAgo]);

  if (overdue.length === 0 && stale.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {overdue.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm font-semibold text-red-400">{overdue.length} cliente(s) com retorno atrasado</p>
          </div>
          <div className="space-y-1.5">
            {overdue.slice(0, 4).map(c => (
              <Link key={c.id} to={`/cliente/${c.id}`} className="flex items-center justify-between text-sm hover:opacity-80">
                <span className="text-red-300">{c.name}</span>
                <span className="text-red-400/70 text-xs">→ {c.next_action || 'Sem ação definida'}</span>
              </Link>
            ))}
            {overdue.length > 4 && <p className="text-xs text-red-400/60">+{overdue.length - 4} outros</p>}
          </div>
        </div>
      )}
      {stale.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-amber-400">{stale.length} cliente(s) sem contato há mais de 5 dias</p>
          </div>
          <div className="space-y-1.5">
            {stale.slice(0, 3).map(c => (
              <Link key={c.id} to={`/cliente/${c.id}`} className="flex items-center justify-between text-sm hover:opacity-80">
                <span className="text-amber-300">{c.name}</span>
                <span className="text-amber-400/70 text-xs">precisa de retorno</span>
              </Link>
            ))}
            {stale.length > 3 && <p className="text-xs text-amber-400/60">+{stale.length - 3} outros</p>}
          </div>
        </div>
      )}
    </div>
  );
}
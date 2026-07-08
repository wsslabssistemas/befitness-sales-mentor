import { Flame, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CoolingLeads({ customers, interactions }) {
  const lastByCustomer = {};
  interactions.forEach(i => {
    if (!lastByCustomer[i.customer_id] || new Date(i.created_date) > new Date(lastByCustomer[i.customer_id].created_date)) {
      lastByCustomer[i.customer_id] = i;
    }
  });

  const now = new Date();
  const threshold = 3;

  const cooling = customers
    .filter(c => c.status !== 'matriculado' && c.status !== 'perdido')
    .map(c => {
      const last = lastByCustomer[c.id];
      const lastDate = last ? new Date(last.created_date) : new Date(c.created_date);
      const days = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      return { ...c, days, lastDate };
    })
    .filter(c => c.days >= threshold)
    .sort((a, b) => b.days - a.days);

  if (cooling.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Flame className="w-5 h-5 text-orange-500" />
        <p className="font-semibold text-gray-900">Leads Esfriando</p>
        <span className="text-xs text-gray-400">sem atendimento há +{threshold} dias</span>
      </div>
      <div className="space-y-2">
        {cooling.slice(0, 8).map(c => (
          <Link key={c.id} to={`/cliente/${c.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${c.days >= 7 ? 'text-red-500' : 'text-amber-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
              <p className="text-xs text-gray-400">último: {c.lastDate.toLocaleDateString('pt-BR')}</p>
            </div>
            <span className={`text-sm font-bold flex-shrink-0 ${c.days >= 7 ? 'text-red-500' : 'text-amber-500'}`}>{c.days}d</span>
          </Link>
        ))}
        {cooling.length > 8 && (
          <p className="text-xs text-gray-400 text-center pt-2">+{cooling.length - 8} outros esfriando</p>
        )}
      </div>
    </div>
  );
}
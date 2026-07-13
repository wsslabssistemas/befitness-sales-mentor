import { Link } from 'react-router-dom';
import { getTrialAlert } from '@/lib/trialJourney';
import { AlertCircle } from 'lucide-react';

const ALERT_STYLES = {
  checkin: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Acompanhamento do trial' },
  preclose: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'Pré-fechamento' },
  conversao: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Conversão pós-trial' },
};

export default function TrialAlerts({ customers }) {
  const alerts = customers
    .map(c => ({ customer: c, alert: getTrialAlert(c) }))
    .filter(a => a.alert);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium text-gray-400 mb-2 px-1">📅 Acompanhamento de semana experimental</p>
      {alerts.map(({ customer, alert }) => {
        const style = ALERT_STYLES[alert.type];
        return (
          <Link key={customer.id} to={`/cliente/${customer.id}`}>
            <div className={`${style.bg} ${style.border} border rounded-xl p-3 flex items-center gap-3 hover:shadow-sm transition-all`}>
              <AlertCircle className={`w-4 h-4 ${style.text} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                <p className={`text-xs ${style.text}`}>{style.label} • Dia {alert.day}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">Enviar mensagem →</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
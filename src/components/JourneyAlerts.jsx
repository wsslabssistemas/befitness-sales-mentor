import { Link } from 'react-router-dom';
import { getTrialAlert } from '@/lib/trialJourney';
import { getRenewalAlert } from '@/lib/customerJourney';
import { AlertCircle } from 'lucide-react';

const ALERT_STYLES = {
  checkin: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Acompanhamento do trial' },
  preclose: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'Pré-fechamento' },
  conversao: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Conversão pós-trial' },
  renewal: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'Renovação próxima' },
  renewal_urgent: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Renovação urgente' },
};

export default function JourneyAlerts({ customers }) {
  const alerts = [];

  customers.forEach(c => {
    const trialAlert = getTrialAlert(c);
    if (trialAlert) {
      alerts.push({ customer: c, type: trialAlert.type, day: trialAlert.day, isTrial: true });
      return;
    }
    const renewalAlert = getRenewalAlert(c);
    if (renewalAlert) {
      alerts.push({ customer: c, type: renewalAlert.urgent ? 'renewal_urgent' : 'renewal', day: renewalAlert.daysUntilRenewal, isTrial: false });
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium text-gray-400 mb-2 px-1">🔔 Acompanhamentos necessários</p>
      {alerts.map((a) => {
        const style = ALERT_STYLES[a.type];
        return (
          <Link key={a.customer.id} to={`/cliente/${a.customer.id}`}>
            <div className={`${style.bg} ${style.border} border rounded-xl p-3 flex items-center gap-3 hover:shadow-sm transition-all`}>
              <AlertCircle className={`w-4 h-4 ${style.text} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{a.customer.name}</p>
                <p className={`text-xs ${style.text}`}>
                  {style.label} • {a.isTrial ? `Dia ${a.day} do trial` : a.day > 0 ? `${a.day} dias para renovar` : `Vencido há ${Math.abs(a.day)} dias`}
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">Enviar →</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
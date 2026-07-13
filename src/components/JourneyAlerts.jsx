import { Link } from 'react-router-dom';
import { getTrialAlert } from '@/lib/trialJourney';
import { getRenewalAlert, getRetentionAlert, getReengagementAlert } from '@/lib/customerJourney';
import { AlertCircle } from 'lucide-react';

const ALERT_STYLES = {
  checkin: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', label: 'Acompanhamento do trial' },
  preclose: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', label: 'Pré-fechamento' },
  conversao: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'Conversão pós-trial' },
  renewal: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', label: 'Renovação próxima' },
  renewal_urgent: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'Renovação urgente' },
  retention: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', label: 'Acompanhamento de retenção' },
  reengagement: { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400', label: 'Reativação de cliente perdido' },
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
      alerts.push({ customer: c, type: renewalAlert.urgent ? 'renewal_urgent' : 'renewal', day: renewalAlert.daysUntilRenewal, isRenewal: true });
      return;
    }
    const retentionAlert = getRetentionAlert(c);
    if (retentionAlert) {
      alerts.push({ customer: c, type: 'retention', day: retentionAlert.milestone, isRetention: true, daysEnrolled: retentionAlert.daysEnrolled });
      return;
    }
    const reengagementAlert = getReengagementAlert(c);
    if (reengagementAlert) {
      alerts.push({ customer: c, type: 'reengagement', day: reengagementAlert.milestone, isReengagement: true, daysLost: reengagementAlert.daysLost });
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">🔔 Acompanhamentos necessários</p>
      {alerts.map((a) => {
        const style = ALERT_STYLES[a.type];
        return (
          <Link key={a.customer.id} to={`/cliente/${a.customer.id}`}>
            <div className={`${style.bg} ${style.border} border rounded-xl p-3 flex items-center gap-3 hover:opacity-90 transition-all`}>
            <AlertCircle className={`w-4 h-4 ${style.text} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{a.customer.name}</p>
                <p className={`text-xs ${style.text}`}>
                  {style.label} • {a.isTrial ? `Dia ${a.day} do trial` : a.isRenewal ? (a.day > 0 ? `${a.day} dias para renovar` : `Vencido há ${Math.abs(a.day)} dias`) : a.isReengagement ? `Há ${a.daysLost} dias perdido` : `Dia ${a.day} de matrícula`}
                </p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">Enviar →</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
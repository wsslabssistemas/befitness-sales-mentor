import { Link, useNavigate } from 'react-router-dom';
import { Phone, ChevronRight, MessageCircle, CreditCard, AlertCircle, Clock, CheckCircle2, Pause, Circle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

function getWhatsAppLink(phone) {
  if (!phone) return '#';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return '#';
  if (!digits.startsWith('55')) digits = '55' + digits;
  return `https://wa.me/${digits}`;
}

export function getActionStatus(customer, now) {
  if (customer.status === 'matriculado') return 'done';
  if (customer.status === 'perdido') return 'lost';

  const isOverdue = customer.next_action_date && new Date(customer.next_action_date) <= now;
  if (isOverdue) return 'urgent';

  const daysSinceInteraction = customer.last_interaction_date
    ? Math.floor((now - new Date(customer.last_interaction_date)) / 86400000)
    : null;

  if (daysSinceInteraction !== null && daysSinceInteraction <= 2) return 'waiting';

  if (customer.next_action_date && new Date(customer.next_action_date) > now) return 'scheduled';

  return 'idle';
}

const ACTION_STATUS = {
  urgent: {
    Icon: AlertCircle, iconColor: 'text-red-400', iconBg: 'bg-red-500/15',
    label: 'Ação necessária', labelClass: 'text-red-400',
    cardBg: 'bg-red-500/5', cardBorder: 'border-red-500/20',
  },
  waiting: {
    Icon: Clock, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/15',
    label: 'Aguardando resposta', labelClass: 'text-blue-400',
    cardBg: 'bg-card', cardBorder: 'border-border',
  },
  scheduled: {
    Icon: CheckCircle2, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/15',
    label: 'Em dia', labelClass: 'text-emerald-400',
    cardBg: 'bg-card', cardBorder: 'border-border',
  },
  done: {
    Icon: CheckCircle2, iconColor: 'text-slate-500', iconBg: 'bg-slate-500/10',
    label: 'Matriculado', labelClass: 'text-slate-500',
    cardBg: 'bg-card', cardBorder: 'border-border',
  },
  lost: {
    Icon: Pause, iconColor: 'text-slate-600', iconBg: 'bg-slate-500/10',
    label: 'Perdido', labelClass: 'text-slate-500',
    cardBg: 'bg-card', cardBorder: 'border-border',
  },
  idle: {
    Icon: Circle, iconColor: 'text-slate-500', iconBg: 'bg-slate-500/10',
    label: 'Sem ação definida', labelClass: 'text-slate-500',
    cardBg: 'bg-card', cardBorder: 'border-border',
  },
};

export default function CustomerCard({ customer, now }) {
  const navigate = useNavigate();
  const actionKey = getActionStatus(customer, now);
  const action = ACTION_STATUS[actionKey];
  const { Icon } = action;
  const daysSinceInteraction = customer.last_interaction_date
    ? Math.floor((now - new Date(customer.last_interaction_date)) / 86400000)
    : null;

  return (
    <Link to={`/cliente/${customer.id}`} className="block">
      <div className={`${action.cardBg} rounded-2xl border ${action.cardBorder} p-4 hover:shadow-md transition-all group`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${action.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-semibold text-foreground truncate">{customer.name}</p>
              <StatusBadge status={customer.status} />
            </div>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className={`text-xs font-medium ${action.labelClass}`}>
                {action.label}
              </span>
              {actionKey === 'waiting' && daysSinceInteraction !== null && (
                <span className="text-xs text-gray-400">há {daysSinceInteraction}d</span>
              )}
              {actionKey === 'urgent' && customer.next_action && (
                <span className="text-xs text-red-500">→ {customer.next_action}</span>
              )}
              {customer.phone && <span className="flex items-center gap-1 text-muted-foreground text-xs"><Phone className="w-3 h-3" />{customer.phone}</span>}
            </div>
          </div>
          {(customer.status === 'matriculado' || customer.status === 'renovado') && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/atendimento?customer=${customer.id}&modo=cobranca`); }}
              className="w-9 h-9 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 flex items-center justify-center flex-shrink-0 transition-colors"
              title="Cobrar parcela em atraso"
            >
              <CreditCard className="w-4 h-4 text-amber-500" />
            </button>
          )}
          {customer.phone && (
            <a
              href={getWhatsAppLink(customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-9 h-9 rounded-xl bg-green-50 hover:bg-green-100 flex items-center justify-center flex-shrink-0 transition-colors"
              title="Abrir WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
            </a>
          )}
          <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
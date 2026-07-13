import { Link } from 'react-router-dom';
import { Phone, ChevronRight, MessageCircle, AlertCircle, Clock, CheckCircle2, Pause, Circle } from 'lucide-react';
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
    Icon: AlertCircle, iconColor: 'text-red-500', iconBg: 'bg-red-100',
    label: 'Ação necessária', labelClass: 'text-red-600',
    cardBg: 'bg-red-50/40', cardBorder: 'border-red-200',
  },
  waiting: {
    Icon: Clock, iconColor: 'text-blue-500', iconBg: 'bg-blue-100',
    label: 'Aguardando resposta', labelClass: 'text-blue-500',
    cardBg: 'bg-white', cardBorder: 'border-gray-100',
  },
  scheduled: {
    Icon: CheckCircle2, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-100',
    label: 'Em dia', labelClass: 'text-emerald-600',
    cardBg: 'bg-white', cardBorder: 'border-gray-100',
  },
  done: {
    Icon: CheckCircle2, iconColor: 'text-gray-400', iconBg: 'bg-gray-100',
    label: 'Matriculado', labelClass: 'text-gray-500',
    cardBg: 'bg-gray-50/50', cardBorder: 'border-gray-100',
  },
  lost: {
    Icon: Pause, iconColor: 'text-gray-400', iconBg: 'bg-gray-100',
    label: 'Perdido', labelClass: 'text-gray-500',
    cardBg: 'bg-gray-50/50', cardBorder: 'border-gray-100',
  },
  idle: {
    Icon: Circle, iconColor: 'text-gray-400', iconBg: 'bg-gray-100',
    label: 'Sem ação definida', labelClass: 'text-gray-400',
    cardBg: 'bg-white', cardBorder: 'border-gray-100',
  },
};

export default function CustomerCard({ customer, now }) {
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
              <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
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
              {customer.phone && <span className="flex items-center gap-1 text-gray-400 text-xs"><Phone className="w-3 h-3" />{customer.phone}</span>}
            </div>
          </div>
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
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
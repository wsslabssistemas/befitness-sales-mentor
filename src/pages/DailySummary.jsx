import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Trophy, UserPlus, MessageSquare, TrendingUp, Sparkles, AlertCircle, Clock, Flame, Zap, Calendar, Phone } from 'lucide-react';

function getWhatsAppLink(phone) {
  if (!phone) return '#';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return '#';
  if (!digits.startsWith('55')) digits = '55' + digits;
  return `https://wa.me/${digits}`;
}

function SectionTitle({ icon: Icon, title, count, color }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      {count > 0 && <span className="text-xs font-medium text-gray-400">({count})</span>}
    </div>
  );
}

function CustomerRow({ c, showDate, highlight }) {
  return (
    <Link to={`/cliente/${c.id}`} className={`block rounded-xl border p-3 hover:border-orange-200 transition-all mb-2 ${highlight || 'bg-white border-gray-100'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-gray-900 truncate">{c.name}</p>
          <p className="text-xs text-gray-500 truncate">
            {showDate && c.next_action_date && `vencimento: ${c.next_action_date} — `}
            {c.next_action || c.objective || 'Sem ação definida'}
            {c.assigned_to && ` • Resp: ${c.assigned_to}`}
          </p>
        </div>
        {c.phone && (
          <a href={getWhatsAppLink(c.phone)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors flex-shrink-0">
            <Phone className="w-3.5 h-3.5 text-green-600" />
          </a>
        )}
      </div>
    </Link>
  );
}

export default function DailySummary() {
  const [customers, setCustomers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Customer.list('-created_date', 200),
      base44.entities.Interaction.list('-created_date', 500),
    ]).then(([c, i]) => { setCustomers(c); setInteractions(i); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  const now = new Date();
  const todayDate = new Date(now); todayDate.setHours(0, 0, 0, 0);
  const weekEnd = new Date(todayDate); weekEnd.setDate(weekEnd.getDate() + 7);
  const threeDaysAgo = new Date(todayDate); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const sevenDaysAgo = new Date(todayDate); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const active = customers.filter(c => c.status !== 'matriculado' && c.status !== 'perdido');
  const overdue = active.filter(c => c.next_action_date && new Date(c.next_action_date) < todayDate);
  const todayActions = active.filter(c => c.next_action_date && new Date(c.next_action_date).toDateString() === todayDate.toDateString());
  const upcoming = active.filter(c => {
    if (!c.next_action_date) return false;
    const d = new Date(c.next_action_date);
    return d > todayDate && d <= weekEnd;
  });
  const cooling = active.filter(c => {
    const ref = c.last_interaction_date ? new Date(c.last_interaction_date) : new Date(c.created_date);
    return ref < sevenDaysAgo;
  }).sort((a, b) => {
    const da = a.last_interaction_date ? new Date(a.last_interaction_date) : new Date(a.created_date);
    const db = b.last_interaction_date ? new Date(b.last_interaction_date) : new Date(b.created_date);
    return da - db;
  });

  const customerIdsWithInteraction = new Set(interactions.map(i => i.customer_id));
  const newLeadsNoInteraction = customers.filter(c => {
    if (c.status === 'matriculado' || c.status === 'perdido') return false;
    if (customerIdsWithInteraction.has(c.id)) return false;
    return new Date(c.created_date) >= threeDaysAgo;
  });

  const monthCustomers = customers.filter(c => new Date(c.created_date) >= monthStart);
  const monthInteractions = interactions.filter(i => new Date(i.created_date) >= monthStart);
  const mMatriculas = monthInteractions.filter(i => i.result === 'matriculou').length;
  const mVisitas = monthInteractions.filter(i => i.result === 'marcou_visita').length;
  const mTrials = monthInteractions.filter(i => i.result === 'semana_experimental').length;
  const mTotalAtend = monthInteractions.length;
  const mTaxa = mTotalAtend > 0 ? ((mMatriculas / mTotalAtend) * 100).toFixed(1) : 0;
  const recentMatriculas = interactions.filter(i => i.result === 'matriculou' && new Date(i.created_date) >= sevenDaysAgo);

  const monthName = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][now.getMonth()];

  const kpis = [
    { label: 'Novos Leads', value: monthCustomers.length, icon: UserPlus, color: 'bg-blue-500' },
    { label: 'Atendimentos', value: mTotalAtend, icon: MessageSquare, color: 'bg-cyan-500' },
    { label: 'Visitas', value: mVisitas, icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Trials', value: mTrials, icon: Sparkles, color: 'bg-purple-500' },
    { label: 'Matrículas', value: mMatriculas, icon: Trophy, color: 'bg-orange-500' },
  ];

  const hasNothing = overdue.length === 0 && todayActions.length === 0 && upcoming.length === 0
    && cooling.length === 0 && newLeadsNoInteraction.length === 0 && mTotalAtend === 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resumo Diário</h1>
        <p className="text-gray-500 text-sm mt-1">{todayDate.toLocaleDateString('pt-BR')} — tudo que você precisa para começar o dia</p>
      </div>

      {/* KPIs do mês */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Fechamento do Mês — {monthName}/{now.getFullYear()}</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {kpis.map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-8 h-8 ${k.color} rounded-lg flex items-center justify-center mb-2`}>
                <k.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 mt-3 text-white flex items-baseline gap-2">
          <p className="text-sm opacity-90">Taxa de Conversão</p>
          <p className="text-2xl font-bold">{mTaxa}%</p>
          <p className="text-sm opacity-80">{mMatriculas}/{mTotalAtend}</p>
        </div>
      </div>

      {/* Matrículas recentes */}
      {recentMatriculas.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={Trophy} title="Matrículas dos últimos 7 dias" count={recentMatriculas.length} color="bg-orange-500" />
          <div className="space-y-1.5">
            {recentMatriculas.map(i => (
              <div key={i.id} className="bg-orange-50/50 rounded-lg p-3 text-sm">
                <span className="font-medium text-gray-900">{i.customer_name || 'Cliente'}</span>
                <span className="text-gray-400"> — atendido por: {i.handled_by || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retornos atrasados */}
      {overdue.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={AlertCircle} title="Retornos Atrasados — Prioridade Máxima" count={overdue.length} color="bg-red-500" />
          <div>
            {overdue.map(c => <CustomerRow key={c.id} c={c} showDate highlight="bg-red-50/40 border-red-100" />)}
          </div>
        </div>
      )}

      {/* Para hoje */}
      {todayActions.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={Clock} title="Para Hoje" count={todayActions.length} color="bg-orange-500" />
          <div>
            {todayActions.map(c => <CustomerRow key={c.id} c={c} />)}
          </div>
        </div>
      )}

      {/* Novos leads sem atendimento */}
      {newLeadsNoInteraction.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={Zap} title="Novos Leads sem Atendimento — Resposta Rápida = Conversão" count={newLeadsNoInteraction.length} color="bg-yellow-500" />
          <div>
            {newLeadsNoInteraction.map(c => (
              <Link key={c.id} to={`/cliente/${c.id}`} className="block bg-white rounded-xl border border-yellow-200 p-3 hover:border-orange-200 transition-all mb-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {c.phone && `${c.phone} • `}
                      {c.lead_source || 'Sem origem'}
                    </p>
                  </div>
                  {c.phone && (
                    <a href={getWhatsAppLink(c.phone)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors flex-shrink-0">
                      Atender agora
                    </a>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Leads esfriando */}
      {cooling.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={Flame} title="Leads Esfriando — Sem contato há 7+ dias" count={cooling.length} color="bg-blue-500" />
          <div>
            {cooling.slice(0, 15).map(c => {
              const lastDate = c.last_interaction_date ? new Date(c.last_interaction_date).toLocaleDateString('pt-BR') : new Date(c.created_date).toLocaleDateString('pt-BR');
              return (
                <Link key={c.id} to={`/cliente/${c.id}`} className="block bg-white rounded-xl border border-gray-100 p-3 hover:border-orange-200 transition-all mb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 truncate">último contato: {lastDate} — {c.next_action || 'Reabordar'}</p>
                    </div>
                    {c.phone && (
                      <a href={getWhatsAppLink(c.phone)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 text-green-600" />
                      </a>
                    )}
                  </div>
                </Link>
              );
            })}
            {cooling.length > 15 && <p className="text-xs text-gray-400 text-center mt-2">+{cooling.length - 15} cliente(s) esfriando...</p>}
          </div>
        </div>
      )}

      {/* Esta semana */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <SectionTitle icon={Calendar} title="Esta Semana" count={upcoming.length} color="bg-emerald-500" />
          <div>
            {upcoming.map(c => <CustomerRow key={c.id} c={c} showDate />)}
          </div>
        </div>
      )}

      {hasNothing && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400 text-sm">Nada pendente para hoje. Tudo em dia! 🎉</p>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import WeekCalendar from '@/components/WeekCalendar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RESULT_CONFIG, STATUS_CONFIG } from '@/lib/statusConfig';
import LeadSourceReport from '@/components/LeadSourceReport';
import { sendDailySummary } from '@/lib/dailySummary';
import CoolingLeads from '@/components/CoolingLeads';
import VendorManager from '@/components/VendorManager';

export default function Indicators() {
  const [interactions, setInteractions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamEmail, setTeamEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Interaction.list('-created_date', 500),
      base44.entities.Customer.list('-created_date', 500),
    ]).then(([ints, custs]) => {
      setInteractions(ints);
      setCustomers(custs);
    }).catch(console.error).finally(() => setLoading(false));
    base44.entities.Setting.filter({ key: 'team_email' }).then(s => { if (s.length > 0) setTeamEmail(s[0].value); }).catch(console.error);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  const handleSaveEmail = async () => {
    try {
      const existing = await base44.entities.Setting.filter({ key: 'team_email' });
      if (existing.length > 0) {
        await base44.entities.Setting.update(existing[0].id, { key: 'team_email', value: teamEmail });
      } else {
        await base44.entities.Setting.create({ key: 'team_email', value: teamEmail });
      }
      setEmailSaved(true);
    } catch (e) { console.error(e); }
  };

  const handleSendSummary = async () => {
    if (!teamEmail) return;
    setSendingSummary(true);
    setSummaryResult(null);
    try {
      const result = await sendDailySummary(teamEmail);
      setSummaryResult(result);
    } catch (e) {
      console.error(e);
      setSummaryResult({ sent: false, reason: 'error' });
    }
    setSendingSummary(false);
  };

  const total = interactions.length;

  const resultCounts = Object.keys(RESULT_CONFIG).filter(k => k !== 'pendente').map(key => ({
    name: RESULT_CONFIG[key].label.split(' ').slice(0, 2).join(' '),
    count: interactions.filter(i => i.result === key).length,
  }));

  const statusCounts = customers.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Indicadores</h1>
        <p className="text-gray-500 text-sm mt-1">Gestão operacional e acompanhamento do dia a dia</p>
      </div>

      <WeekCalendar customers={customers} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="font-semibold text-gray-900 mb-4">Resultados dos Atendimentos</p>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resultCounts}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {resultCounts.map((_, i) => <Cell key={i} fill="#f97316" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-12">Sem dados ainda</p>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="font-semibold text-gray-900 mb-4">Clientes por Status</p>
          <div className="space-y-2.5">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = statusCounts[key] || 0;
              const pct = customers.length > 0 ? (count / customers.length * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                  <span className="text-xs text-gray-600 w-28 truncate">{cfg.label}</span>
                  <div className="flex-1 bg-gray-50 rounded-full h-5 overflow-hidden">
                    <div className={`h-full ${cfg.dot} opacity-60 rounded-full transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <VendorManager />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <LeadSourceReport customers={customers} />
        <CoolingLeads customers={customers} interactions={interactions} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
        <p className="font-semibold text-gray-900 mb-1">Notificações por Email</p>
        <p className="text-sm text-gray-500 mb-4">Cadastre o email da equipe. O resumo diário (retornos pendentes + agenda do dia) é enviado automaticamente uma vez por dia quando alguém abre o sistema.</p>
        <div className="flex gap-2 mb-3">
          <input
            type="email"
            value={teamEmail}
            onChange={e => { setTeamEmail(e.target.value); setEmailSaved(false); }}
            placeholder="equipe@befitness.com.br"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSaveEmail}>
            {emailSaved ? '✓ Salvo' : 'Salvar'}
          </Button>
        </div>
        <Button variant="outline" className="w-full" onClick={handleSendSummary} disabled={sendingSummary || !teamEmail}>
          {sendingSummary ? 'Enviando...' : '📧 Enviar resumo diário agora'}
        </Button>
        {summaryResult && (
          <p className="text-sm mt-2 text-center">
            {summaryResult.sent
              ? `✓ Resumo enviado! (${summaryResult.overdue} atrasado(s), ${summaryResult.today} para hoje, ${summaryResult.upcoming} na semana)`
              : summaryResult.reason === 'nothing'
                ? 'Nada pendente para reportar hoje.'
                : 'Erro ao enviar. Tente novamente.'}
          </p>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, UserPlus, MessageSquare, Sparkles, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SalesFunnel from '@/components/SalesFunnel';
import SellerReport from '@/components/SellerReport';
import ResponseTime from '@/components/ResponseTime';
import MonthlyActivityLog from '@/components/monthly/MonthlyActivityLog';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function MonthlyReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [interactions, setInteractions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Interaction.list('-created_date', 500),
      base44.entities.Customer.list('-created_date', 500),
    ]).then(([ints, custs]) => {
      setInteractions(ints);
      setCustomers(custs);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const isInMonth = (dateStr) => {
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() === month - 1;
  };

  const monthInteractions = interactions.filter(i => isInMonth(i.created_date));
  const monthCustomers = customers.filter(c => isInMonth(c.created_date));

  const matriculas = monthInteractions.filter(i => i.result === 'matriculou').length;
  const visitas = monthInteractions.filter(i => i.result === 'marcou_visita').length;
  const experimentais = monthInteractions.filter(i => i.result === 'semana_experimental').length;
  const newLeads = monthCustomers.length;
  const totalAtend = monthInteractions.length;
  const taxa = totalAtend > 0 ? ((matriculas / totalAtend) * 100).toFixed(1) : 0;

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const years = [];
  const minYear = interactions.length > 0
    ? Math.min(...interactions.map(i => new Date(i.created_date).getFullYear()), now.getFullYear())
    : now.getFullYear();
  for (let y = now.getFullYear(); y >= minYear; y--) years.push(y);

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  const handleDeleteSeller = async (name) => {
    try {
      await base44.entities.Interaction.updateMany(
        { handled_by: name },
        { $set: { handled_by: '' } }
      );
      await base44.entities.Customer.updateMany(
        { assigned_to: name },
        { $set: { assigned_to: '' } }
      );
      const [ints, custs] = await Promise.all([
        base44.entities.Interaction.list('-created_date', 500),
        base44.entities.Customer.list('-created_date', 500),
      ]);
      setInteractions(ints);
      setCustomers(custs);
    } catch (e) {
      console.error(e);
      alert('Erro ao remover. Tente novamente.');
    }
  };

  const metrics = [
    { label: 'Novos Leads', value: newLeads, icon: UserPlus, color: 'bg-blue-500' },
    { label: 'Atendimentos', value: totalAtend, icon: MessageSquare, color: 'bg-cyan-500' },
    { label: 'Visitas Agendadas', value: visitas, icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Trials Iniciados', value: experimentais, icon: Sparkles, color: 'bg-purple-500' },
    { label: 'Matrículas', value: matriculas, icon: Trophy, color: 'bg-orange-500' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatório Mensal</h1>
        <p className="text-gray-500 text-sm mt-1">Fechamento comercial do período selecionado</p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-6 bg-white rounded-2xl border border-gray-100 p-4">
        <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`w-9 h-9 ${m.color} rounded-xl flex items-center justify-center mb-2`}>
              <m.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-500">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 mb-6 text-white">
        <p className="text-sm opacity-90 mb-1">Taxa de Conversão do Mês</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold">{taxa}%</p>
          <p className="text-sm opacity-80">{matriculas} matrículas / {totalAtend} atendimentos</p>
        </div>
      </div>

      <SalesFunnel customers={monthCustomers} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <SellerReport interactions={monthInteractions} customers={monthCustomers} onDelete={handleDeleteSeller} />
        <ResponseTime customers={monthCustomers} interactions={interactions} />
      </div>

      <div className="mt-6">
        <MonthlyActivityLog interactions={monthInteractions} />
      </div>
    </div>
  );
}
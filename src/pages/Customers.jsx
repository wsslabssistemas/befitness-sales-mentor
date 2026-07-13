import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CustomerForm from '@/components/CustomerForm';
import CustomerCard, { getActionStatus } from '@/components/CustomerCard';
import OverdueWidget from '@/components/OverdueWidget';
import JourneyAlerts from '@/components/JourneyAlerts';
import { STATUS_CONFIG } from '@/lib/statusConfig';

function sortByUrgency(customers) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return [...customers].sort((a, b) => {
    const aOverdue = a.next_action_date && new Date(a.next_action_date) <= now;
    const bOverdue = b.next_action_date && new Date(b.next_action_date) <= now;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    const aDate = a.last_interaction_date ? new Date(a.last_interaction_date) : new Date(a.created_date || 0);
    const bDate = b.last_interaction_date ? new Date(b.last_interaction_date) : new Date(b.created_date || 0);
    return aDate - bDate;
  });
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [attentionToday, setAttentionToday] = useState(false);
  const [filterVendor, setFilterVendor] = useState('all');
  const [sortBy, setSortBy] = useState('urgency');
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    loadCustomers();
    base44.entities.Vendor.filter({ status: 'ativo' }).then(setVendors).catch(console.error);
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await base44.entities.Customer.list('-created_date', 200);
      setCustomers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async (formData) => {
    await base44.entities.Customer.create(formData);
    setShowForm(false);
    loadCustomers();

  };

  const now = new Date(); now.setHours(0, 0, 0, 0);

  const filtered = customers.filter(c => {
    const matchesSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesVendor = filterVendor === 'all' || c.assigned_to === filterVendor;
    const matchesAttention = !attentionToday || (c.status !== 'matriculado' && c.status !== 'perdido' && c.next_action_date && new Date(c.next_action_date) <= now);
    return matchesSearch && matchesStatus && matchesVendor && matchesAttention;
  });

  const sorted = sortBy === 'urgency' ? sortByUrgency(filtered)
    : sortBy === 'name' ? [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    : sortBy === 'created' ? [...filtered].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
    : sortBy === 'interaction' ? [...filtered].sort((a, b) => {
        const da = a.last_interaction_date ? new Date(a.last_interaction_date) : new Date(a.created_date || 0);
        const db = b.last_interaction_date ? new Date(b.last_interaction_date) : new Date(b.created_date || 0);
        return da - db;
      })
    : filtered;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} cliente(s) • ordenados por urgência</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-1.5" /> Novo Cliente
        </Button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="pl-9" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-card text-foreground">
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-card text-foreground">
          <option value="all">Todos responsáveis</option>
          {vendors.map(v => (
            <option key={v.id} value={v.name}>{v.name}</option>
          ))}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-card text-foreground">
          <option value="urgency">Ordenar: Urgência</option>
          <option value="name">Ordenar: Nome A-Z</option>
          <option value="created">Ordenar: Cadastro recente</option>
          <option value="interaction">Ordenar: Última interação</option>
        </select>
        <button
          onClick={() => setAttentionToday(!attentionToday)}
          className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 flex-shrink-0 ${
            attentionToday ? 'bg-orange-500 text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span className="hidden lg:inline">Atenção Hoje</span>
        </button>
      </div>

      {!loading && sorted.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: 'urgent', label: 'Urgente', Icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { key: 'waiting', label: 'Aguardando', Icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { key: 'scheduled', label: 'Em dia', Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          ].map(item => {
            const count = sorted.filter(c => getActionStatus(c, now) === item.key).length;
            if (count === 0) return null;
            return (
              <div key={item.key} className={`${item.bg} ${item.border} border rounded-xl px-3 py-1.5 flex items-center gap-2`}>
                <item.Icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm font-semibold text-foreground">{count}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {!loading && <OverdueWidget customers={customers} />}
      {!loading && <JourneyAlerts customers={customers} />}

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Carregando...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Nenhum cliente encontrado</p>
          <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-1.5" /> Cadastrar primeiro cliente
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(customer => (
            <CustomerCard key={customer.id} customer={customer} now={now} />
          ))}
        </div>
      )}

      {showForm && <CustomerForm onSave={handleSave} onClose={() => setShowForm(false)} />}
    </div>
  );
}
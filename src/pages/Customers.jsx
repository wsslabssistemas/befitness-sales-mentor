import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Phone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/StatusBadge';
import CustomerForm from '@/components/CustomerForm';
import OverdueWidget from '@/components/OverdueWidget';
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

  useEffect(() => { loadCustomers(); }, []);

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
    try {
      const settings = await base44.entities.Setting.filter({ key: 'team_email' });
      if (settings.length > 0 && settings[0].value) {
        await base44.integrations.Core.SendEmail({
          to: settings[0].value,
          subject: `Novo cliente: ${formData.name}`,
          body: `Um novo cliente entrou na base da Be Fitness!\n\nNome: ${formData.name}\n${formData.phone ? `Telefone: ${formData.phone}\n` : ''}${formData.objective ? `Objetivo: ${formData.objective}\n` : ''}\nAcesse o sistema para visualizar e iniciar o atendimento.`,
        });
      }
    } catch (e) { console.error(e); }
  };

  const filtered = customers.filter(c => {
    const matchesSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sorted = sortByUrgency(filtered);
  const now = new Date(); now.setHours(0, 0, 0, 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} cliente(s) • ordenados por urgência</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-1.5" /> Novo Cliente
        </Button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="pl-9" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {!loading && <OverdueWidget customers={customers} />}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Carregando...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Nenhum cliente encontrado</p>
          <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-1.5" /> Cadastrar primeiro cliente
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(customer => {
            const isOverdue = customer.next_action_date && new Date(customer.next_action_date) <= now;
            return (
              <Link key={customer.id} to={`/cliente/${customer.id}`} className="block">
                <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-1 h-12 rounded-full ${STATUS_CONFIG[customer.status]?.dot || 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                        <StatusBadge status={customer.status} />
                        {isOverdue && (
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Atrasado</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>}
                        {customer.objective && <span>{customer.objective}</span>}
                        {customer.next_action && <span className="text-orange-600">→ {customer.next_action}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-400 flex-shrink-0" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showForm && <CustomerForm onSave={handleSave} onClose={() => setShowForm(false)} />}
    </div>
  );
}
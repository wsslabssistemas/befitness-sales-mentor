import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Edit, MessageSquare, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import CustomerForm from '@/components/CustomerForm';
import InteractionCard from '@/components/InteractionCard';
import { PROFILE_CONFIG } from '@/lib/statusConfig';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [c, ints] = await Promise.all([
        base44.entities.Customer.get(id),
        base44.entities.Interaction.filter({ customer_id: id }, '-created_date', 50),
      ]);
      setCustomer(c);
      setInteractions(ints);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (formData) => {
    await base44.entities.Customer.update(id, formData);
    setShowEdit(false);
    loadData();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;
  if (!customer) return <div className="p-8 text-center text-gray-400">Cliente não encontrado</div>;

  const profileCfg = customer.profile ? PROFILE_CONFIG[customer.profile] : null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar para clientes
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{customer.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <StatusBadge status={customer.status} />
              {profileCfg && <span className="text-sm text-gray-500">{profileCfg.emoji} {profileCfg.label}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Edit className="w-4 h-4 mr-1.5" /> Editar
            </Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => navigate(`/atendimento?customer=${id}`)}>
              <MessageSquare className="w-4 h-4 mr-1.5" /> Atender
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
          {customer.phone && <div><p className="text-xs text-gray-400 mb-0.5">Telefone</p><p className="text-sm font-medium">{customer.phone}</p></div>}
          {customer.objective && <div><p className="text-xs text-gray-400 mb-0.5">Objetivo</p><p className="text-sm font-medium">{customer.objective}</p></div>}
          {customer.assigned_to && <div><p className="text-xs text-gray-400 mb-0.5">Responsável</p><p className="text-sm font-medium">{customer.assigned_to}</p></div>}
          {customer.next_action && <div><p className="text-xs text-gray-400 mb-0.5">Próxima Ação</p><p className="text-sm font-medium text-orange-600">{customer.next_action}</p></div>}
        </div>
        {customer.notes && <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-50">{customer.notes}</p>}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Atendimentos</h2>
      {interactions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Nenhum atendimento registrado ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map(i => <InteractionCard key={i.id} interaction={i} />)}
        </div>
      )}

      {showEdit && <CustomerForm customer={customer} onSave={handleUpdate} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
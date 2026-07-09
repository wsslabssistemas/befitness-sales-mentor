import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VendorManager() {
  const [vendors, setVendors] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setVendors(await base44.entities.Vendor.list('name', 100));
    } catch (e) { console.error(e); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await base44.entities.Vendor.create({ name: newName.trim(), status: 'ativo' });
    setNewName('');
    load();
  };

  const toggleStatus = async (v) => {
    await base44.entities.Vendor.update(v.id, { status: v.status === 'ativo' ? 'inativo' : 'ativo' });
    load();
  };

  const handleDelete = async (v) => {
    if (!confirm(`Excluir o vendedor "${v.name}"?`)) return;
    await base44.entities.Vendor.delete(v.id);
    load();
  };

  const active = vendors.filter(v => v.status === 'ativo');
  const inactive = vendors.filter(v => v.status === 'inativo');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-orange-500" />
        <p className="font-semibold text-gray-900">Equipe de Vendedores</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do vendedor..." />
        <Button type="submit" className="bg-orange-500 hover:bg-orange-600 flex-shrink-0">
          <UserPlus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </form>

      <div className="space-y-2">
        {active.map(v => (
          <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-green-50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-700">{v.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleStatus(v)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Inativar</button>
              <button onClick={() => handleDelete(v)} className="text-gray-300 hover:text-red-500 transition-colors" title="Excluir">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {inactive.map(v => (
          <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 opacity-60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-500">{v.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleStatus(v)} className="text-xs text-gray-400 hover:text-green-600 transition-colors">Reativivar</button>
              <button onClick={() => handleDelete(v)} className="text-gray-300 hover:text-red-500 transition-colors" title="Excluir">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {vendors.length === 0 && (
          <p className="text-center text-gray-400 py-4 text-sm">Nenhum vendedor cadastrado ainda</p>
        )}
      </div>
    </div>
  );
}
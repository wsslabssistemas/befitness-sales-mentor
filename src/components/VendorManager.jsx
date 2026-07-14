import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, UserPlus, Trash2, ArrowRight, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VendorManager() {
  const [vendors, setVendors] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [newName, setNewName] = useState('');
  const [replacingName, setReplacingName] = useState(null);
  const [replacementTarget, setReplacementTarget] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [v, ints] = await Promise.all([
        base44.entities.Vendor.list('name', 100),
        base44.entities.Interaction.list('-created_date', 500),
      ]);
      setVendors(v);
      setInteractions(ints);
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
    if (!confirm(`Excluir o vendedor "${v.name}" do cadastro? Os atendimentos já registrados manterão o nome no histórico.`)) return;
    await base44.entities.Vendor.delete(v.id);
    load();
  };

  const handleReplace = async (oldName) => {
    if (!replacementTarget || replacementTarget === oldName) return;
    if (!confirm(`Transferir TODOS os atendimentos e clientes de "${oldName}" para "${replacementTarget}"? "${oldName}" será removido do cadastro.`)) return;
    setTransferring(true);
    try {
      await base44.entities.Interaction.updateMany(
        { handled_by: oldName },
        { $set: { handled_by: replacementTarget } }
      );
      await base44.entities.Customer.updateMany(
        { assigned_to: oldName },
        { $set: { assigned_to: replacementTarget } }
      );
      const oldVendor = vendors.find(v => v.name === oldName);
      if (oldVendor) {
        await base44.entities.Vendor.delete(oldVendor.id);
      }
      setReplacingName(null);
      setReplacementTarget('');
      load();
    } catch (e) {
      console.error(e);
      alert('Erro ao transferir. Tente novamente.');
    } finally {
      setTransferring(false);
    }
  };

  const active = vendors.filter(v => v.status === 'ativo');
  const inactive = vendors.filter(v => v.status === 'inativo');

  const vendorNames = new Set(vendors.map(v => v.name));
  const ghostNames = [...new Set(
    interactions.map(i => i.handled_by).filter(n => n && !vendorNames.has(n))
  )].sort();

  const renderReplaceUI = (name) => {
    const options = vendors.filter(v => v.name !== name);
    return (
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <Select value={replacementTarget} onValueChange={setReplacementTarget}>
          <SelectTrigger className="h-8 text-xs flex-1 min-w-[160px]">
            <SelectValue placeholder="Selecionar substituto..." />
          </SelectTrigger>
          <SelectContent>
            {options.map(v => (
              <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="bg-orange-500/100 hover:bg-orange-600 h-8"
          disabled={!replacementTarget || transferring}
          onClick={() => handleReplace(name)}
        >
          <ArrowRight className="w-3 h-3 mr-1" /> Transferir
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => { setReplacingName(null); setReplacementTarget(''); }}
        >
          Cancelar
        </Button>
      </div>
    );
  };

  const renderActions = (v, isInactive) => (
    <div className="flex items-center gap-3">
      <button
        onClick={() => toggleStatus(v)}
        className={`text-xs transition-colors ${isInactive ? 'text-muted-foreground hover:text-green-400' : 'text-muted-foreground hover:text-red-500'}`}
      >
        {isInactive ? 'Reativivar' : 'Inativar'}
      </button>
      <button
        onClick={() => { setReplacingName(v.name); setReplacementTarget(''); }}
        className="text-xs text-muted-foreground hover:text-orange-500 transition-colors"
      >
        Substituir
      </button>
      <button
        onClick={() => handleDelete(v)}
        className="text-muted-foreground hover:text-red-500 transition-colors"
        title="Excluir cadastro"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-orange-500" />
        <p className="font-semibold text-foreground">Equipe de Vendedores</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do vendedor..." />
        <Button type="submit" className="bg-orange-500/100 hover:bg-orange-600 flex-shrink-0">
          <UserPlus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </form>

      <div className="space-y-2">
        {active.map(v => (
          <div key={v.id} className="p-2.5 rounded-lg bg-green-500/10">
            {replacingName === v.name ? (
              <div>
                <p className="text-sm font-medium text-foreground">Substituir: {v.name}</p>
                {renderReplaceUI(v.name)}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500/100" />
                  <span className="text-sm font-medium text-foreground">{v.name}</span>
                </div>
                {renderActions(v, false)}
              </div>
            )}
          </div>
        ))}
        {inactive.map(v => (
          <div key={v.id} className="p-2.5 rounded-lg bg-secondary opacity-70">
            {replacingName === v.name ? (
              <div>
                <p className="text-sm font-medium text-foreground">Substituir: {v.name}</p>
                {renderReplaceUI(v.name)}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-sm text-muted-foreground">{v.name}</span>
                </div>
                {renderActions(v, true)}
              </div>
            )}
          </div>
        ))}
        {ghostNames.length > 0 && (
          <div className="pt-3 mt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-4 h-4 text-orange-400" />
              <p className="text-xs font-medium text-muted-foreground">Nomes sem cadastro (em atendimentos)</p>
            </div>
            {ghostNames.map(name => (
              <div key={name} className="p-2.5 rounded-lg bg-orange-500/10 mb-2">
                {replacingName === name ? (
                  <div>
                    <p className="text-sm font-medium text-foreground">Substituir: {name}</p>
                    {renderReplaceUI(name)}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-sm text-muted-foreground">{name}</span>
                    </div>
                    <button
                      onClick={() => { setReplacingName(name); setReplacementTarget(''); }}
                      className="text-xs text-muted-foreground hover:text-orange-500 transition-colors"
                    >
                      Substituir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {vendors.length === 0 && ghostNames.length === 0 && (
          <p className="text-center text-muted-foreground py-4 text-sm">Nenhum vendedor cadastrado ainda</p>
        )}
      </div>
    </div>
  );
}
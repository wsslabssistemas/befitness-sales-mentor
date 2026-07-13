import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_CONFIG, PROFILE_CONFIG } from '@/lib/statusConfig';
import { base44 } from '@/api/base44Client';
import { Trash2 } from 'lucide-react';

const LEAD_SOURCES = ['Instagram', 'Facebook', 'WhatsApp', 'Telefone', 'Presencial', 'Indicação'];

export default function CustomerForm({ customer, onSave, onClose, onDelete }) {
  const [vendors, setVendors] = useState([]);
  const [duplicateError, setDuplicateError] = useState('');

  useEffect(() => {
    base44.entities.Vendor.filter({ status: 'ativo' }).then(setVendors).catch(console.error);
  }, []);

  const [form, setForm] = useState({
    name: '', phone: '', objective: '', status: 'novo_contato', profile: 'outro',
    notes: '', next_action: '', next_action_date: '', assigned_to: '',
    lead_source: '', lead_source_custom: '', trial_start_date: '',
    enrollment_date: '', plan_type: 'trimestral',
    lost_date: '',
  });

  useEffect(() => {
    if (customer) {
      const existingSource = customer.lead_source || '';
      const isPreset = LEAD_SOURCES.includes(existingSource);
      setForm({
        name: customer.name || '', phone: customer.phone || '',
        objective: customer.objective || '', status: customer.status || 'novo_contato',
        profile: customer.profile || 'outro', notes: customer.notes || '',
        next_action: customer.next_action || '',
        next_action_date: customer.next_action_date ? customer.next_action_date.split('T')[0] : '',
        assigned_to: customer.assigned_to || '',
        lead_source: isPreset ? existingSource : (existingSource ? '__outro' : ''),
        lead_source_custom: isPreset ? '' : existingSource,
        trial_start_date: customer.trial_start_date ? customer.trial_start_date.split('T')[0] : '',
        enrollment_date: customer.enrollment_date ? customer.enrollment_date.split('T')[0] : '',
        plan_type: customer.plan_type || 'trimestral',
        lost_date: customer.lost_date ? customer.lost_date.split('T')[0] : '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDuplicateError('');

    if (form.phone) {
      const normalized = form.phone.replace(/\D/g, '');
      if (normalized.length > 0) {
        const existing = await base44.entities.Customer.list('-created_date', 500);
        const duplicate = existing.find(c => {
          if (customer && c.id === customer.id) return false;
          return c.phone && c.phone.replace(/\D/g, '') === normalized;
        });
        if (duplicate) {
          setDuplicateError(`Já existe um cliente cadastrado com este número: "${duplicate.name}"`);
          return;
        }
      }
    }

    const data = { ...form };
    if (data.lead_source === '__outro') {
      data.lead_source = data.lead_source_custom || '';
    }
    delete data.lead_source_custom;
    if (data.status === 'perdido' && !data.lost_date) {
      data.lost_date = new Date().toISOString().split('T')[0];
    }
    onSave(data);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Nome *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Telefone</Label>
            <Input value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); setDuplicateError(''); }} placeholder="(48) 99999-9999" />
          {duplicateError && (
            <p className="mt-1.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              ⚠️ {duplicateError}
            </p>
          )}
          </div>
          <div>
            <Label className="mb-1.5 block">Origem do Lead</Label>
            <Select value={form.lead_source} onValueChange={v => setForm({ ...form, lead_source: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                <SelectItem value="__outro">Outro / Campanha específica</SelectItem>
              </SelectContent>
            </Select>
            {form.lead_source === '__outro' && (
              <Input
                value={form.lead_source_custom}
                onChange={e => setForm({ ...form, lead_source_custom: e.target.value })}
                placeholder="Ex: Campanha Verão Instagram, Promoção Dia das Mães..."
                className="mt-2"
              />
            )}
          </div>
          <div>
            <Label className="mb-1.5 block">Objetivo</Label>
            <Input value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} placeholder="Emagrecer, ganhar massa, saúde..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Perfil</Label>
              <Select value={form.profile} onValueChange={v => setForm({ ...form, profile: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROFILE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.emoji} {cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.status === 'semana_experimental' && (
            <div>
              <Label className="mb-1.5 block">Início da Semana Experimental</Label>
              <Input type="date" value={form.trial_start_date} onChange={e => setForm({ ...form, trial_start_date: e.target.value })} />
            </div>
          )}
          {form.status === 'matriculado' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Data de Matrícula</Label>
                <Input type="date" value={form.enrollment_date} onChange={e => setForm({ ...form, enrollment_date: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1.5 block">Tipo de Plano</Label>
                <Select value={form.plan_type} onValueChange={v => setForm({ ...form, plan_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div>
            <Label className="mb-1.5 block">Próxima Ação</Label>
            <Input value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })} placeholder="Retornar amanhã, aguardar resposta..." />
          </div>
          <div>
            <Label className="mb-1.5 block">Data da Próxima Ação</Label>
            <Input type="date" value={form.next_action_date} onChange={e => setForm({ ...form, next_action_date: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Responsável Atual</Label>
            <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {form.assigned_to && !vendors.some(v => v.name === form.assigned_to) && (
                  <SelectItem value={form.assigned_to}>{form.assigned_to}</SelectItem>
                )}
                {vendors.map(v => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <DialogFooter>
            {customer && onDelete && (
              <Button type="button" variant="destructive" onClick={() => {
                if (confirm(`Excluir o cliente "${customer.name}" e todo o histórico de atendimentos?`)) onDelete(customer);
              }} className="mr-auto">
                <Trash2 className="w-4 h-4 mr-1.5" /> Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
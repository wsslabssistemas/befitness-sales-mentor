import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_CONFIG, PROFILE_CONFIG } from '@/lib/statusConfig';

export default function CustomerForm({ customer, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', phone: '', objective: '', status: 'novo_contato', profile: 'outro',
    notes: '', next_action: '', next_action_date: '', assigned_to: '',
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '', phone: customer.phone || '',
        objective: customer.objective || '', status: customer.status || 'novo_contato',
        profile: customer.profile || 'outro', notes: customer.notes || '',
        next_action: customer.next_action || '',
        next_action_date: customer.next_action_date ? customer.next_action_date.split('T')[0] : '',
        assigned_to: customer.assigned_to || '',
      });
    }
  }, [customer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
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
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(48) 99999-9999" />
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
            <Input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} placeholder="Nome do recepcionista" />
          </div>
          <div>
            <Label className="mb-1.5 block">Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
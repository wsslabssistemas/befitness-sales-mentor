import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function LibraryEntryEditor({ entry, categoryId, categoryName, onSave, onClose }) {
  const [form, setForm] = useState({
    category_id: '', category_name: '', question: '', answer: '',
    objective: '', technique: '', common_mistakes: '', next_step: '',
  });

  useEffect(() => {
    if (entry) {
      setForm({
        category_id: entry.category_id || categoryId || '',
        category_name: entry.category_name || categoryName || '',
        question: entry.question || '', answer: entry.answer || '',
        objective: entry.objective || '', technique: entry.technique || '',
        common_mistakes: entry.common_mistakes || '', next_step: entry.next_step || '',
      });
    } else {
      setForm(f => ({ ...f, category_id: categoryId, category_name: categoryName }));
    }
  }, [entry, categoryId, categoryName]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? 'Editar Entrada' : 'Nova Entrada'} — {categoryName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Pergunta Comum do Cliente *</Label>
            <Textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} rows={2} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Resposta Recomendada</Label>
            <Textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} rows={4} />
          </div>
          <div>
            <Label className="mb-1.5 block">Objetivo da Resposta</Label>
            <Input value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Técnica Comercial</Label>
            <Input value={form.technique} onChange={e => setForm({ ...form, technique: e.target.value })} placeholder="Venda consultiva, pergunta aberta..." />
          </div>
          <div>
            <Label className="mb-1.5 block">Erros Comuns a Evitar</Label>
            <Textarea value={form.common_mistakes} onChange={e => setForm({ ...form, common_mistakes: e.target.value })} rows={2} />
          </div>
          <div>
            <Label className="mb-1.5 block">Próximo Passo</Label>
            <Input value={form.next_step} onChange={e => setForm({ ...form, next_step: e.target.value })} />
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
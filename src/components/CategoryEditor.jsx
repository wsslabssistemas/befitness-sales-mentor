import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

export default function CategoryEditor({ category, onSave, onClose, onDelete }) {
  const [form, setForm] = useState({ name: '', icon: '📋', description: '', sort_order: 0 });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
        icon: category.icon || '📋',
        description: category.description || '',
        sort_order: category.sort_order || 0,
      });
    }
  }, [category]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Nome *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Ícone (emoji)</Label>
            <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="💰" />
          </div>
          <div>
            <Label className="mb-1.5 block">Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <DialogFooter>
            {category && onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete} className="mr-auto">
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
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
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CategoryEditor from '@/components/CategoryEditor';
import LibraryEntryEditor from '@/components/LibraryEntryEditor';

export default function Library() {
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCatEditor, setShowCatEditor] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showEntryEditor, setShowEntryEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [cats, ents] = await Promise.all([
        base44.entities.LibraryCategory.list('sort_order', 100),
        base44.entities.LibraryEntry.list('-created_date', 200),
      ]);
      setCategories(cats);
      setEntries(ents);
      if (cats.length > 0 && !selectedCat) setSelectedCat(cats[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const catEntries = entries.filter(e => e.category_id === selectedCat);
  const selectedCategory = categories.find(c => c.id === selectedCat);

  const handleDeleteEntry = async (id) => {
    if (!confirm('Excluir esta entrada?')) return;
    await base44.entities.LibraryEntry.delete(id);
    loadData();
  };

  const handleDeleteCat = async (id) => {
    if (!confirm('Excluir esta categoria e todas as suas entradas?')) return;
    const catEntries = entries.filter(e => e.category_id === id);
    if (catEntries.length > 0) {
      await base44.entities.LibraryEntry.deleteMany({ category_id: id });
    }
    await base44.entities.LibraryCategory.delete(id);
    if (selectedCat === id) setSelectedCat(null);
    setShowCatEditor(false);
    loadData();
  };

  const handleSaveCategory = async (data) => {
    if (editingCategory) {
      await base44.entities.LibraryCategory.update(editingCategory.id, data);
    } else {
      await base44.entities.LibraryCategory.create(data);
    }
    setShowCatEditor(false);
    setEditingCategory(null);
    loadData();
  };

  const handleSaveEntry = async (data) => {
    if (editingEntry) {
      await base44.entities.LibraryEntry.update(editingEntry.id, data);
    } else {
      await base44.entities.LibraryEntry.create({ ...data, category_id: selectedCat, category_name: selectedCategory?.name });
    }
    setShowEntryEditor(false);
    setEditingEntry(null);
    loadData();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Biblioteca Comercial</h1>
        <p className="text-muted-foreground text-sm mt-1">Base de conhecimento que alimenta as respostas sugeridas pela IA</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Categorias</p>
            <Button size="sm" variant="ghost" onClick={() => { setEditingCategory(null); setShowCatEditor(true); }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCat === cat.id ? 'bg-orange-500/10 text-orange-400 font-medium' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <span>{cat.icon || '📋'}</span>
                <span className="flex-1 text-left truncate">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{entries.filter(e => e.category_id === cat.id).length}</span>
              </button>
            ))}
            {categories.length === 0 && <p className="text-sm text-muted-foreground p-3">Nenhuma categoria</p>}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {selectedCategory ? (
            <>
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {selectedCategory.icon} {selectedCategory.name}
                  </h2>
                  {selectedCategory.description && (
                    <p className="text-sm text-muted-foreground truncate">{selectedCategory.description}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingCategory(selectedCategory); setShowCatEditor(true); }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" className="bg-orange-500/100 hover:bg-orange-600" onClick={() => { setEditingEntry(null); setShowEntryEditor(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Nova Entrada
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {catEntries.length === 0 ? (
                  <div className="bg-card rounded-xl border border-border p-8 text-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhuma entrada nesta categoria ainda</p>
                  </div>
                ) : (
                  catEntries.map(entry => (
                    <div key={entry.id} className="bg-card rounded-xl border border-border p-5">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <p className="font-medium text-foreground text-sm">{entry.question}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => { setEditingEntry(entry); setShowEntryEditor(true); }} className="p-1.5 text-muted-foreground hover:text-foreground">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteEntry(entry.id)} className="p-1.5 text-muted-foreground hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-orange-500/100/10 rounded-lg p-3 mb-3">
                        <p className="text-xs text-orange-400 mb-1">Resposta recomendada</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{entry.answer}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {entry.objective && <div><p className="text-xs text-muted-foreground">Objetivo</p><p className="text-muted-foreground">{entry.objective}</p></div>}
                        {entry.technique && <div><p className="text-xs text-muted-foreground">Técnica</p><p className="text-muted-foreground">{entry.technique}</p></div>}
                        {entry.common_mistakes && <div><p className="text-xs text-muted-foreground">Erros comuns</p><p className="text-red-400">{entry.common_mistakes}</p></div>}
                        {entry.next_step && <div><p className="text-xs text-muted-foreground">Próximo passo</p><p className="text-orange-400">{entry.next_step}</p></div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Selecione uma categoria</p>
            </div>
          )}
        </div>
      </div>

      {showCatEditor && (
        <CategoryEditor
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => { setShowCatEditor(false); setEditingCategory(null); }}
          onDelete={editingCategory ? () => handleDeleteCat(editingCategory.id) : null}
        />
      )}

      {showEntryEditor && (
        <LibraryEntryEditor
          entry={editingEntry}
          categoryId={selectedCat}
          categoryName={selectedCategory?.name}
          onSave={handleSaveEntry}
          onClose={() => { setShowEntryEditor(false); setEditingEntry(null); }}
        />
      )}
    </div>
  );
}
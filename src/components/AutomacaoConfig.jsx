import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Save } from 'lucide-react';
import { DEFAULT_CONFIG, loadConfig, configToSettings } from '@/lib/automationRulesClient';

const FIELDS = [
  { key: 'max_messages_per_day', label: 'Máx. de mensagens por dia', hint: 'Limite total gerado pela automação em 24h' },
  { key: 'min_hours_between_contacts', label: 'Horas mín. entre contatos', hint: 'Espera mínima desde o último contato (sem resposta)' },
  { key: 'max_unanswered_contacts', label: 'Máx. de não-respostas', hint: 'Após N mensagens sem resposta, para de incomodar' },
  { key: 'cooldown_after_reply_hours', label: 'Cooldown após resposta (h)', hint: 'Espera após o cliente responder/engajar' },
  { key: 'working_window_start', label: 'Início da janela (h)', hint: 'Horário a partir do qual a automação opera' },
  { key: 'working_window_end', label: 'Fim da janela (h)', hint: 'Horário em que a automação para' },
  { key: 'stop_bothering_days', label: 'Parar de incomodar (dias)', hint: 'Sem engajamento por N dias → bloqueia' },
];

export default function AutomacaoConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await base44.entities.Setting.list();
        setConfig(loadConfig(settings));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const pairs = configToSettings(config);
      const existing = await base44.entities.Setting.list();
      const existingMap = {};
      for (const s of existing) existingMap[s.key] = s;
      for (const p of pairs) {
        if (existingMap[p.key]) {
          await base44.entities.Setting.update(existingMap[p.key].id, { value: p.value });
        } else {
          await base44.entities.Setting.create({ key: p.key, value: p.value });
        }
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-orange-400" />
        <h2 className="font-semibold text-foreground">Regras Anti-Bloqueio</h2>
      </div>

      <div className="mb-5">
        <Label className="mb-1.5 block">Modo de Operação</Label>
        <div className="flex gap-2">
          {['off', 'simulacao', 'automatico'].map(m => (
            <button
              key={m}
              onClick={() => setConfig({ ...config, auto_mode: m })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.auto_mode === m
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {m === 'off' ? 'Desligado' : m === 'simulacao' ? 'Simulação' : 'Automático'}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {config.auto_mode === 'off' && 'A automação não roda. Operação 100% manual.'}
          {config.auto_mode === 'simulacao' && 'Gera as mensagens mas NÃO envia — só registra no log para revisão.'}
          {config.auto_mode === 'automatico' && 'Gera e envia respeitando todas as regras abaixo.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map(f => (
          <div key={f.key}>
            <Label className="mb-1 block">{f.label}</Label>
            <Input
              type="number"
              value={config[f.key]}
              onChange={e => setConfig({ ...config, [f.key]: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="mt-5 bg-orange-500 hover:bg-orange-600 text-white">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Regras
      </Button>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle, Save, Check, Copy, ExternalLink } from 'lucide-react';

const WHATSAPP_FIELDS = [
  { key: 'whatsapp_token', label: 'Token de Acesso', hint: 'Token permanente gerado em API Setup', type: 'password' },
  { key: 'whatsapp_phone_number_id', label: 'Phone Number ID', hint: 'ID interno (não é o número de telefone)', type: 'text' },
  { key: 'whatsapp_app_secret', label: 'App Secret', hint: 'App Settings → Basic → App Secret', type: 'password' },
  { key: 'whatsapp_verify_token', label: 'Verify Token', hint: 'Token de verificação do webhook', type: 'text' },
];

const WEBHOOK_URL = 'https://api.base44.com/functions/whatsappWebhook';
const DEFAULT_VERIFY_TOKEN = 'befitness_verify_2024';

export default function WhatsAppConfig() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await base44.entities.Setting.list();
        const map = {};
        for (const s of settings) {
          if (s.key.startsWith('whatsapp_')) map[s.key] = s.value;
        }
        // Garante o verify token padrão se vazio
        if (!map.whatsapp_verify_token) map.whatsapp_verify_token = DEFAULT_VERIFY_TOKEN;
        setValues(map);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const existing = await base44.entities.Setting.list();
      const existingMap = {};
      for (const s of existing) existingMap[s.key] = s;
      for (const f of WHATSAPP_FIELDS) {
        const val = values[f.key] || '';
        if (existingMap[f.key]) {
          await base44.entities.Setting.update(existingMap[f.key].id, { value: val });
        } else {
          await base44.entities.Setting.create({ key: f.key, value: val });
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar credenciais.');
    } finally {
      setSaving(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isComplete = values.whatsapp_token && values.whatsapp_phone_number_id;

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="bg-card rounded-xl border border-emerald-500/20 p-5">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="w-5 h-5 text-emerald-400" />
        <h2 className="font-semibold text-foreground">Credenciais do WhatsApp</h2>
        {isComplete ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Configurado</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Incompleto</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Preencha as credenciais abaixo com os dados do seu app no Meta for Developers. O webhook usa estes valores para receber e responder mensagens.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {WHATSAPP_FIELDS.map(f => (
          <div key={f.key}>
            <Label className="mb-1 block">{f.label}</Label>
            <Input
              type={f.type}
              value={values[f.key] || ''}
              onChange={e => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.type === 'password' ? '••••••••' : ''}
            />
            <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>
          </div>
        ))}
      </div>

      {/* Webhook reference */}
      <div className="mt-5 space-y-2">
        <div className="bg-secondary/50 rounded-lg p-3 border border-border flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Callback URL (cole no Meta → Configuration → Webhook):</p>
            <code className="text-xs text-emerald-400 break-all">{WEBHOOK_URL}</code>
          </div>
          <button onClick={copyWebhook} className="flex-shrink-0 p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          No Meta, inscreva o webhook no campo <b className="text-foreground">messages</b>.{' '}
          <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-1">
            Abrir Meta for Developers <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saved ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {saved ? 'Salvo!' : 'Salvar Credenciais'}
      </Button>
    </div>
  );
}
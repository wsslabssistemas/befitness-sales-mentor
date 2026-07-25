import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AutomacaoConfig from '@/components/AutomacaoConfig';
import AutomationLogTable from '@/components/AutomationLogTable';

export default function Automacao() {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [preview, setPreview] = useState(null);
  const [running, setRunning] = useState(false);
  const [config, setConfig] = useState({ auto_mode: 'off' });

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const l = await base44.entities.AutomationLog.list('-run_date', 60);
      setLogs(l);
    } catch (e) { console.error(e); }
    finally { setLoadingLogs(false); }
  };

  const loadConfigState = async () => {
    try {
      const settings = await base44.entities.Setting.list();
      const map = {};
      for (const s of settings) map[s.key] = s.value;
      setConfig({ auto_mode: map.auto_mode || 'off' });
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadLogs(); loadConfigState(); }, []);

  const monthLogs = logs.filter(l => {
    if (!l.run_date) return false;
    const d = new Date(l.run_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthCredits = monthLogs.reduce((s, l) => s + (l.estimated_credits || 0), 0);
  const monthTokens = monthLogs.reduce((s, l) => s + (l.estimated_tokens || 0), 0);
  const monthGenerated = monthLogs.reduce((s, l) => s + (l.messages_generated || 0), 0);
  const monthSkipped = monthLogs.reduce((s, l) => s + (l.messages_skipped || 0), 0);

  const runSimulation = async () => {
    setRunning(true);
    setPreview(null);
    try {
      const res = await base44.functions.invoke('gerarProativas', { dry_run: true });
      setPreview(res.data);
      loadLogs();
    } catch (e) {
      console.error(e);
      alert('Erro ao rodar simulação.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automação Proativa</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle de tokens, regras anti-bloqueio e acompanhamento da automação</p>
        </div>
        <Button onClick={runSimulation} disabled={running} className="bg-orange-500 hover:bg-orange-600 text-white">
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Rodar Simulação
        </Button>
      </div>

      {/* Status do modo */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        config.auto_mode === 'automatico'
          ? 'bg-orange-500/10 border-orange-500/30'
          : config.auto_mode === 'simulacao'
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-card border-border'
      }`}>
        {config.auto_mode === 'automatico'
          ? <Zap className="w-5 h-5 text-orange-400" />
          : config.auto_mode === 'simulacao'
            ? <ShieldCheck className="w-5 h-5 text-blue-400" />
            : <AlertTriangle className="w-5 h-5 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium text-foreground">
            Modo atual: {config.auto_mode === 'automatico' ? 'Automático' : config.auto_mode === 'simulacao' ? 'Simulação' : 'Desligado'}
          </p>
          <p className="text-xs text-muted-foreground">
            {config.auto_mode === 'off' && 'A automação está desligada — nenhuma mensagem é gerada ou enviada.'}
            {config.auto_mode === 'simulacao' && 'Gera mensagens mas NÃO envia — só registra no log para sua revisão.'}
            {config.auto_mode === 'automatico' && 'Gera e envia respeitando todas as regras anti-bloqueio configuradas.'}
          </p>
        </div>
      </div>

      {/* Resumo de consumo do mês */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Execuções no mês" value={monthLogs.length} />
        <SummaryCard label="Mensagens geradas" value={monthGenerated} tone="emerald" />
        <SummaryCard label="Mensagens bloqueadas" value={monthSkipped} tone="amber" />
        <SummaryCard label="Créditos estimados" value={monthCredits} tone="orange" sub={`${monthTokens.toLocaleString('pt-BR')} tokens`} />
      </div>

      {/* Preview da simulação */}
      {preview && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3">
            Prévia da Simulação — {preview.data_geracao}
          </h2>
          <div className="flex gap-4 flex-wrap mb-4 text-sm">
            <span className="text-muted-foreground">Clientes devidos: <b className="text-foreground">{preview.total_clientes_due}</b></span>
            <span className="text-muted-foreground">Tarefas geradas: <b className="text-emerald-400">{preview.total_tarefas}</b></span>
            <span className="text-muted-foreground">Bloqueadas: <b className="text-amber-400">{(preview.total_clientes_due || 0) - (preview.total_tarefas || 0)}</b></span>
          </div>
          {preview.tarefas?.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {preview.tarefas.slice(0, 20).map((t, i) => (
                <div key={i} className="border border-border/60 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">{t.cliente}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t.publico}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Estágio: {t.estagio || '—'} · Status: {t.status_atual}</p>
                  {t.ultima_mensagem && (
                    <p className="text-xs text-muted-foreground italic mt-1 truncate">Última: "{t.ultima_mensagem}"</p>
                  )}
                  <p className="text-sm text-foreground mt-2 line-clamp-3">{t.mensagem_base}</p>
                </div>
              ))}
              {preview.tarefas.length > 20 && (
                <p className="text-xs text-muted-foreground text-center pt-2">+{preview.tarefas.length - 20} tarefas...</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Config */}
      <AutomacaoConfig />

      {/* Log */}
      <div>
        <h2 className="font-semibold text-foreground mb-3">Histórico de Execuções</h2>
        <AutomationLogTable logs={logs} loading={loadingLogs} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone, sub }) {
  const toneClass = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    orange: 'text-orange-400',
    default: 'text-foreground',
  }[tone || 'default'];
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
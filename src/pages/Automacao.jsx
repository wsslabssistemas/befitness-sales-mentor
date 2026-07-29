import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Zap, ShieldCheck, AlertTriangle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AutomacaoConfig from '@/components/AutomacaoConfig';
import AutomacaoChannels from '@/components/AutomacaoChannels';
import WhatsAppConfig from '@/components/WhatsAppConfig';
import AutomationLogTable from '@/components/AutomationLogTable';

export default function Automacao() {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [preview, setPreview] = useState(null);
  const [running, setRunning] = useState(false);
  const [config, setConfig] = useState({ auto_mode: 'off' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

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
      setConfig({
        auto_mode: map.auto_mode || 'off',
        monthly_credit_budget: Number(map.auto_monthly_budget) || 0,
      });
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

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const allIds = (preview?.tarefas || []).map((t) => t.customer_id);
    if (!allIds.length) return;
    setSelectedIds((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)));
  };

  const sendSelected = async (all = false) => {
    const ids = all ? (preview?.tarefas || []).map((t) => t.customer_id) : [...selectedIds];
    if (!ids.length) {
      alert('Selecione ao menos um cliente na prévia.');
      return;
    }
    if (!confirm(all ? `Confirmar envio de ${ids.length} mensagens?` : `Confirmar envio de ${ids.length} mensagem(ns) selecionada(s)?`)) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await base44.functions.invoke('enviarProativasAprovadas', { customer_ids: ids });
      setSendResult(res.data);
      setSelectedIds(new Set());
      loadLogs();
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar mensagens aprovadas.');
    } finally {
      setSending(false);
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

      {/* Indicador de orçamento mensal */}
      {config.monthly_credit_budget > 0 && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${
          monthCredits >= config.monthly_credit_budget
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-card border-border'
        }`}>
          <AlertTriangle className={`w-5 h-5 ${monthCredits >= config.monthly_credit_budget ? 'text-red-400' : 'text-orange-400'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Orçamento mensal: {monthCredits} / {config.monthly_credit_budget} créditos
            </p>
            <div className="h-2 bg-secondary rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${monthCredits >= config.monthly_credit_budget ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(100, (monthCredits / config.monthly_credit_budget) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthCredits >= config.monthly_credit_budget
                ? 'Orçamento atingido — automação suspensa até a virada do mês.'
                : `Restam ${config.monthly_credit_budget - monthCredits} créditos neste ciclo.`}
            </p>
          </div>
        </div>
      )}

      {/* Preview da simulação */}
      {preview && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="font-semibold text-foreground">Prévia da Simulação — {preview.data_geracao}</h2>
            <span className="text-xs text-muted-foreground">A simulação NÃO envia nem marca nada como enviado. Selecione e aprove abaixo.</span>
          </div>
          <div className="flex gap-4 flex-wrap mb-4 text-sm">
            <span className="text-muted-foreground">Devidos: <b className="text-foreground">{preview.total_clientes_due}</b></span>
            <span className="text-muted-foreground">Geradas: <b className="text-emerald-400">{preview.total_tarefas}</b></span>
            <span className="text-muted-foreground">Bloqueadas: <b className="text-amber-400">{(preview.total_clientes_due || 0) - (preview.total_tarefas || 0)}</b></span>
          </div>

          {preview.tarefas?.length > 0 ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-3 border-b border-border">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === preview.tarefas.length && selectedIds.size > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-orange-500"
                  />
                  Selecionar todos ({preview.tarefas.length})
                </label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => sendSelected(false)} disabled={sending || selectedIds.size === 0}>
                    {sending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                    Enviar Selecionados ({selectedIds.size})
                  </Button>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => sendSelected(true)} disabled={sending}>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Enviar Todos
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                {preview.tarefas.map((t, i) => {
                  const checked = selectedIds.has(t.customer_id);
                  return (
                    <label key={i} className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${checked ? 'border-orange-500/40 bg-orange-500/5' : 'border-border/60 hover:bg-white/5'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleSelect(t.customer_id)} className="w-4 h-4 mt-0.5 accent-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
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
                    </label>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa gerada nesta simulação (todos bloqueados pelas regras anti-bloqueio).</p>
          )}
        </div>
      )}

      {/* Resultado do envio aprovado */}
      {sendResult && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-2">Resultado do Envio Aprovado</h2>
          <div className="flex gap-4 flex-wrap mb-3 text-sm">
            <span className="text-muted-foreground">Enviados: <b className="text-emerald-400">{sendResult.enviados}</b></span>
            <span className="text-muted-foreground">Bloqueados: <b className="text-amber-400">{sendResult.bloqueados}</b></span>
            <span className="text-muted-foreground">Créditos: <b className="text-orange-400">{sendResult.estimated_credits}</b></span>
          </div>
          {sendResult.bloqueios?.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Bloqueios:</p>
              {sendResult.bloqueios.map((b, i) => (
                <p key={i}>• {b.cliente || b.cliente_id}: {b.motivo}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Canais e regras */}
      <AutomacaoChannels />

      {/* Credenciais WhatsApp */}
      <WhatsAppConfig />

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
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

export default function AutomationLogTable({ logs, loading }) {
  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }
  if (!logs.length) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Data</th>
              <th className="text-left px-4 py-3 font-medium">Modo</th>
              <th className="text-right px-4 py-3 font-medium">Devidos</th>
              <th className="text-right px-4 py-3 font-medium">Geradas</th>
              <th className="text-right px-4 py-3 font-medium">Bloqueadas</th>
              <th className="text-right px-4 py-3 font-medium">IA Calls</th>
              <th className="text-right px-4 py-3 font-medium">Tokens</th>
              <th className="text-right px-4 py-3 font-medium">Créditos</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {log.run_date ? format(new Date(log.run_date), "dd/MM 'às' HH:mm", { locale: ptBR }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    log.mode === 'automatico'
                      ? 'bg-orange-500/15 text-orange-400 border-orange-500/20'
                      : 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                  }`}>
                    {log.mode === 'automatico' ? 'Automático' : 'Simulação'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-foreground">{log.customers_due ?? 0}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-medium">{log.messages_generated ?? 0}</td>
                <td className="px-4 py-3 text-right text-amber-400">{log.messages_skipped ?? 0}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{log.llm_calls ?? 0}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{log.estimated_tokens ?? 0}</td>
                <td className="px-4 py-3 text-right text-orange-400 font-medium">{log.estimated_credits ?? 0}</td>
                <td className="px-4 py-3">
                  {log.status === 'erro'
                    ? <span className="text-xs text-red-400">Erro</span>
                    : <span className="text-xs text-emerald-400">OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Target, Lightbulb, ArrowRight, Brain, Heart, TrendingUp, Crosshair, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RESULT_CONFIG, STATUS_CONFIG } from '@/lib/statusConfig';

export default function AttendanceResult({ analysis, copied, onCopy, onSaveResult, onSuggestedUpdate, hasCustomer, currentStatus }) {
  const [pendingVisit, setPendingVisit] = useState(false);
  const [visitDate, setVisitDate] = useState('');

  const handleResultClick = (key) => {
    if (key === 'marcou_visita') {
      setPendingVisit(true);
    } else {
      onSaveResult(key);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="bg-orange-500/10 rounded-2xl border border-orange-500/20 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-orange-400">📋 Resposta Sugerida</p>
          <Button size="sm" variant="outline" onClick={onCopy} className="bg-card hover:bg-orange-500/10">
            {copied ? <><Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Copiado!</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Copiar</>}
          </Button>
        </div>
        <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">{analysis.resposta_sugerida}</p>
      </div>

      {(analysis.etapa_jornada || analysis.emocao_dominante) && (
        <div className="flex gap-3">
          {analysis.etapa_jornada && (
            <div className="flex-1 bg-card rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><TrendingUp className="w-3 h-3" /> Etapa da Jornada</p>
              <p className="text-sm font-medium text-foreground">{analysis.etapa_jornada}</p>
            </div>
          )}
          {analysis.emocao_dominante && (
            <div className="flex-1 bg-card rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Heart className="w-3 h-3" /> Emoção Dominante</p>
              <p className="text-sm font-medium text-foreground">{analysis.emocao_dominante}</p>
            </div>
          )}
        </div>
      )}

      {analysis.objetivo_resposta && (
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Target className="w-3 h-3" /> Objetivo desta Resposta</p>
          <p className="text-sm text-foreground">{analysis.objetivo_resposta}</p>
        </div>
      )}

      {analysis.explicacao && (
        <div className="bg-blue-500/10 rounded-xl border border-blue-500/20 p-4">
          <p className="text-xs text-blue-400 flex items-center gap-1 mb-1"><Lightbulb className="w-3 h-3" /> Por que esta resposta?</p>
          <p className="text-sm text-foreground leading-relaxed">{analysis.explicacao}</p>
        </div>
      )}

      {(analysis.tecnica_selecionada || analysis.motivo_selecao) && (
        <div className="bg-purple-500/100/10 rounded-xl border border-purple-500/20 p-4">
          {analysis.tecnica_selecionada && (
            <>
              <p className="text-xs text-purple-400 flex items-center gap-1 mb-1"><Crosshair className="w-3 h-3" /> Técnica Selecionada</p>
              <p className="text-sm font-semibold text-foreground mb-2">{analysis.tecnica_selecionada}</p>
            </>
          )}
          {analysis.motivo_selecao && (
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.motivo_selecao}</p>
          )}
        </div>
      )}

      {analysis.tecnicas && Array.isArray(analysis.tecnicas) && analysis.tecnicas.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><Brain className="w-3 h-3" /> Técnicas Comerciais Utilizadas</p>
          <div className="flex flex-wrap gap-2">
            {analysis.tecnicas.map((t, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">{t}</span>
            ))}
          </div>
        </div>
      )}

      {analysis.proximo_passo && (
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><ArrowRight className="w-3 h-3" /> Próximo Passo Recomendado</p>
          <p className="text-sm font-medium text-orange-400">{analysis.proximo_passo}</p>
        </div>
      )}

      {hasCustomer && analysis.status_sugerido && analysis.status_sugerido !== currentStatus && STATUS_CONFIG[analysis.status_sugerido] && (
        <div className="bg-green-500/10 rounded-2xl border border-green-500/30 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-400 mb-1">🚀 Avanço na Jornada Detectado</p>
              <p className="text-sm text-foreground mb-1">
                O cliente está pronto para avançar para: <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${STATUS_CONFIG[analysis.status_sugerido]?.badge}`}>{STATUS_CONFIG[analysis.status_sugerido]?.label}</span>
              </p>
              {analysis.motivo_status && (
                <p className="text-xs text-muted-foreground mb-3">{analysis.motivo_status}</p>
              )}
              <Button
                size="sm"
                onClick={() => onSuggestedUpdate(analysis.status_sugerido)}
                className="bg-green-600 hover:bg-green-700"
              >
                <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                Atualizar Jornada
              </Button>
            </div>
          </div>
        </div>
      )}

      {hasCustomer && (
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Registrar Resultado do Atendimento</p>
          {pendingVisit ? (
            <div className="bg-orange-500/10 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-400" /> Para qual dia agendou a visita?
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="date"
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border text-sm flex-1 min-w-[150px]"
                  autoFocus
                />
                <Button
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={!visitDate}
                  onClick={() => { onSaveResult('marcou_visita', visitDate); setPendingVisit(false); setVisitDate(''); }}
                >
                  Confirmar
                </Button>
                <Button variant="outline" onClick={() => { setPendingVisit(false); setVisitDate(''); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(RESULT_CONFIG).filter(([k]) => k !== 'pendente').map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleResultClick(key)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-all hover:scale-105 ${cfg.badge}`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
import { motion } from 'framer-motion';
import { Copy, Check, Target, Lightbulb, ArrowRight, Brain, Heart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RESULT_CONFIG } from '@/lib/statusConfig';

export default function AttendanceResult({ analysis, copied, onCopy, onSaveResult, hasCustomer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-orange-700">📋 Resposta Sugerida</p>
          <Button size="sm" variant="outline" onClick={onCopy} className="bg-white hover:bg-orange-50">
            {copied ? <><Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Copiado!</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Copiar</>}
          </Button>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{analysis.resposta_sugerida}</p>
      </div>

      {(analysis.etapa_jornada || analysis.emocao_dominante) && (
        <div className="flex gap-3">
          {analysis.etapa_jornada && (
            <div className="flex-1 bg-white rounded-xl border border-gray-100 p-3">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><TrendingUp className="w-3 h-3" /> Etapa da Jornada</p>
              <p className="text-sm font-medium text-gray-700">{analysis.etapa_jornada}</p>
            </div>
          )}
          {analysis.emocao_dominante && (
            <div className="flex-1 bg-white rounded-xl border border-gray-100 p-3">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Heart className="w-3 h-3" /> Emoção Dominante</p>
              <p className="text-sm font-medium text-gray-700">{analysis.emocao_dominante}</p>
            </div>
          )}
        </div>
      )}

      {analysis.objetivo_resposta && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Target className="w-3 h-3" /> Objetivo desta Resposta</p>
          <p className="text-sm text-gray-700">{analysis.objetivo_resposta}</p>
        </div>
      )}

      {analysis.explicacao && (
        <div className="bg-blue-50/40 rounded-xl border border-blue-100 p-4">
          <p className="text-xs text-blue-600 flex items-center gap-1 mb-1"><Lightbulb className="w-3 h-3" /> Por que esta resposta?</p>
          <p className="text-sm text-gray-700 leading-relaxed">{analysis.explicacao}</p>
        </div>
      )}

      {analysis.tecnicas && Array.isArray(analysis.tecnicas) && analysis.tecnicas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-2"><Brain className="w-3 h-3" /> Técnicas Comerciais Utilizadas</p>
          <div className="flex flex-wrap gap-2">
            {analysis.tecnicas.map((t, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">{t}</span>
            ))}
          </div>
        </div>
      )}

      {analysis.proximo_passo && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><ArrowRight className="w-3 h-3" /> Próximo Passo Recomendado</p>
          <p className="text-sm font-medium text-orange-600">{analysis.proximo_passo}</p>
        </div>
      )}

      {hasCustomer && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Registrar Resultado do Atendimento</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(RESULT_CONFIG).filter(([k]) => k !== 'pendente').map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => onSaveResult(key)}
                className={`text-xs px-3 py-2 rounded-lg border transition-all hover:scale-105 ${cfg.badge}`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
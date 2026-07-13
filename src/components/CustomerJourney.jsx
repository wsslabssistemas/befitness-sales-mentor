import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getJourneyInfo, getRenewalInfo, getMessageStage } from '@/lib/customerJourney';
import JourneyMessage from '@/components/JourneyMessage';
import { Loader2, Check, CheckCircle2, CalendarDays, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CustomerJourney({ customer, interactions, onSaved }) {
  const [trialDate, setTrialDate] = useState(customer.trial_start_date || new Date().toISOString().split('T')[0]);
  const [savingTrialDate, setSavingTrialDate] = useState(false);
  const [enrollmentDate, setEnrollmentDate] = useState(customer.enrollment_date || new Date().toISOString().split('T')[0]);
  const [planType, setPlanType] = useState(customer.plan_type || 'trimestral');
  const [savingEnrollment, setSavingEnrollment] = useState(false);

  const journeyInfo = getJourneyInfo(customer, interactions);
  const renewalInfo = getRenewalInfo(customer);
  const msgStage = getMessageStage(customer, journeyInfo, renewalInfo);

  const needTrialDate = customer.status === 'semana_experimental' && !customer.trial_start_date;
  const needEnrollmentDate = customer.status === 'matriculado' && !customer.enrollment_date;

  const handleSetTrialDate = async () => {
    setSavingTrialDate(true);
    try {
      await base44.entities.Customer.update(customer.id, { trial_start_date: trialDate });
      if (onSaved) onSaved();
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar data.');
    } finally {
      setSavingTrialDate(false);
    }
  };

  const handleSetEnrollment = async () => {
    setSavingEnrollment(true);
    try {
      await base44.entities.Customer.update(customer.id, { enrollment_date: enrollmentDate, plan_type: planType });
      if (onSaved) onSaved();
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar.');
    } finally {
      setSavingEnrollment(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900">Jornada do Cliente</h2>
        {journeyInfo.isLost && <span className="text-xs font-medium text-gray-400">Cliente perdido</span>}
      </div>

      <div className="flex items-start">
        {journeyInfo.stages.map((stage, i) => (
          <div key={stage.id} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                stage.done ? 'bg-green-500 border-green-500 text-white' :
                stage.current ? 'bg-orange-500 border-orange-500 text-white animate-pulse' :
                'bg-gray-50 border-gray-200 text-gray-300'
              }`}>
                {stage.done ? <CheckCircle2 className="w-5 h-5" /> : stage.icon}
              </div>
              <div className="text-center min-w-[56px]">
                <p className={`text-xs font-medium ${stage.done ? 'text-green-600' : stage.current ? 'text-orange-600' : 'text-gray-400'}`}>
                  {stage.label}
                </p>
                <p className="text-[10px] text-gray-400">{stage.subtitle}</p>
              </div>
            </div>
            {i < journeyInfo.stages.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mt-5 rounded ${stage.done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {needTrialDate && (
        <div className="mt-5 bg-orange-50/50 rounded-xl p-4 border border-orange-100">
          <p className="text-sm text-gray-700 mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-orange-500" /> Defina a data de início da semana experimental:
          </p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input type="date" value={trialDate} onChange={e => setTrialDate(e.target.value)} />
            </div>
            <Button onClick={handleSetTrialDate} disabled={savingTrialDate} className="bg-orange-500 hover:bg-orange-600">
              {savingTrialDate ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
              Ativar
            </Button>
          </div>
        </div>
      )}

      {needEnrollmentDate && (
        <div className="mt-5 bg-green-50/50 rounded-xl p-4 border border-green-100">
          <p className="text-sm text-gray-700 mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-green-500" /> Defina a data de matrícula e o plano:
          </p>
          <div className="flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-gray-400 mb-1 block">Data de matrícula</label>
              <Input type="date" value={enrollmentDate} onChange={e => setEnrollmentDate(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-gray-400 mb-1 block">Tipo de plano</label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSetEnrollment} disabled={savingEnrollment} className="bg-green-600 hover:bg-green-700">
              {savingEnrollment ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
              Ativar
            </Button>
          </div>
        </div>
      )}

      {customer.status === 'semana_experimental' && journeyInfo.trialInfo && (
        <div className="mt-4 bg-blue-50/30 rounded-xl p-3 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Acompanhamento do trial</p>
            <span className="text-xs text-gray-400">Dia {journeyInfo.trialInfo.day}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {journeyInfo.trialInfo.stages.map(s => (
              <div key={s.id} className={`flex-1 text-center py-1.5 px-1 rounded-lg text-[11px] font-medium ${
                s.done ? 'bg-green-100 text-green-700' :
                s.id === journeyInfo.trialInfo.currentStageId ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-400'
              }`}>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {customer.status === 'matriculado' && renewalInfo && (
        <div className={`mt-4 rounded-xl p-4 border ${
          renewalInfo.daysUntilRenewal <= 15 ? 'bg-red-50 border-red-100' :
          renewalInfo.daysUntilRenewal <= 30 ? 'bg-orange-50 border-orange-100' :
          'bg-green-50 border-green-100'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">{renewalInfo.daysEnrolled} dias de matrícula</p>
              <p className={`text-xs ${renewalInfo.daysUntilRenewal <= 15 ? 'text-red-600' : renewalInfo.daysUntilRenewal <= 30 ? 'text-orange-600' : 'text-green-600'}`}>
                {renewalInfo.daysUntilRenewal > 0
                  ? `Renovação em ${renewalInfo.daysUntilRenewal} dias (${renewalInfo.endDate.toLocaleDateString('pt-BR')})`
                  : `Vencido há ${Math.abs(renewalInfo.daysUntilRenewal)} dias`}
              </p>
            </div>
            {renewalInfo.daysUntilRenewal <= 30 && (
              <AlertCircle className={`w-5 h-5 ${renewalInfo.daysUntilRenewal <= 15 ? 'text-red-500' : 'text-orange-500'}`} />
            )}
          </div>
        </div>
      )}

      {customer.status === 'matriculado' && journeyInfo.retentionInfo && journeyInfo.retentionInfo.milestones.some(m => m.due) && (
        <div className="mt-4 bg-purple-50/30 rounded-xl p-3 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Acompanhamento de retenção</p>
            <span className="text-xs text-gray-400">{journeyInfo.retentionInfo.daysEnrolled} dias</span>
          </div>
          <div className="flex items-center gap-1.5">
            {journeyInfo.retentionInfo.milestones.map(m => (
              <div key={m.day} className={`flex-1 text-center py-1.5 px-1 rounded-lg text-[11px] font-medium ${
                m.done ? 'bg-green-100 text-green-700' :
                m.due ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-400'
              }`}>
                {m.day}d
              </div>
            ))}
          </div>
        </div>
      )}

      {customer.status === 'matriculado' && !needEnrollmentDate && !msgStage && (
        <div className="mt-4 bg-green-50/50 rounded-xl p-3 border border-green-100 text-center">
          <p className="text-sm text-green-600 font-medium">✓ Tudo em dia! Nenhum acompanhamento necessário agora.</p>
        </div>
      )}

      {!needTrialDate && !needEnrollmentDate && msgStage && (
        <div className={`mt-5 rounded-xl p-4 border ${
          journeyInfo.isLost ? 'bg-gray-50 border-gray-200' : 'bg-orange-50/50 border-orange-100'
        }`}>
          {!journeyInfo.isLost && (
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-orange-500" />
              <p className="text-sm font-medium text-gray-700">{journeyInfo.guidance}</p>
            </div>
          )}
          {journeyInfo.isLost && (
            <p className="text-sm text-gray-600 mb-3">Gere uma mensagem para reativar este cliente:</p>
          )}
          <JourneyMessage
            stageId={msgStage.stage}
            stageLabel={msgStage.label}
            customer={customer}
            interactions={interactions}
            onSaved={onSaved}
          />
        </div>
      )}
    </div>
  );
}
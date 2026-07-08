import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function OverdueEmailChecker() {
  useEffect(() => {
    const checkAndNotify = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        const lastNotified = await base44.entities.Setting.filter({ key: 'last_overdue_notification' });
        if (lastNotified.length > 0 && lastNotified[0].value === today) return;

        const emailSetting = await base44.entities.Setting.filter({ key: 'team_email' });
        if (emailSetting.length === 0 || !emailSetting[0].value) return;

        const customers = await base44.entities.Customer.list('-created_date', 200);
        const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
        const overdue = customers.filter(c => {
          if (c.status === 'matriculado' || c.status === 'perdido') return false;
          if (!c.next_action_date) return false;
          return new Date(c.next_action_date) < todayDate;
        });

        if (overdue.length === 0) return;

        const body = `Atenção! ${overdue.length} cliente(s) com retorno atrasado:\n\n` +
          overdue.map(c => `• ${c.name} — ${c.next_action || 'Sem ação'} (vencimento: ${c.next_action_date})`).join('\n') +
          `\n\nAcesse o sistema para iniciar os retornos e não perder vendas.`;

        await base44.integrations.Core.SendEmail({
          to: emailSetting[0].value,
          subject: `⚠️ ${overdue.length} retorno(s) atrasado(s) — Be Fitness`,
          body,
        });

        if (lastNotified.length > 0) {
          await base44.entities.Setting.update(lastNotified[0].id, { key: 'last_overdue_notification', value: today });
        } else {
          await base44.entities.Setting.create({ key: 'last_overdue_notification', value: today });
        }
      } catch (e) { console.error(e); }
    };

    const timer = setTimeout(checkAndNotify, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
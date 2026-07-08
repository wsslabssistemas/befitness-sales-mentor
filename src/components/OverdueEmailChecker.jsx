import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { sendDailySummary } from '@/lib/dailySummary';

export default function OverdueEmailChecker() {
  useEffect(() => {
    const checkAndNotify = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lastSent = await base44.entities.Setting.filter({ key: 'last_daily_email' });
        if (lastSent.length > 0 && lastSent[0].value === today) return;

        const emailSetting = await base44.entities.Setting.filter({ key: 'team_email' });
        if (emailSetting.length === 0 || !emailSetting[0].value) return;

        const result = await sendDailySummary(emailSetting[0].value);
        if (!result.sent) return;

        if (lastSent.length > 0) {
          await base44.entities.Setting.update(lastSent[0].id, { key: 'last_daily_email', value: today });
        } else {
          await base44.entities.Setting.create({ key: 'last_daily_email', value: today });
        }
      } catch (e) { console.error(e); }
    };

    const timer = setTimeout(checkAndNotify, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
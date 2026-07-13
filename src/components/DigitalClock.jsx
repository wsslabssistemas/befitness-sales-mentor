import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isOpenAt } from '@/lib/gymHours';

export default function DigitalClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const open = isOpenAt(now);
  const dayName = format(now, "EEEE", { locale: ptBR });
  const timeStr = format(now, "HH:mm:ss");

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500 capitalize">{dayName}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${open ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
          {open ? 'Aberto' : 'Fechado'}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums tracking-tight">{timeStr}</p>
      <p className="text-xs text-gray-400 mt-0.5">{format(now, "dd 'de' MMMM", { locale: ptBR })}</p>
    </div>
  );
}
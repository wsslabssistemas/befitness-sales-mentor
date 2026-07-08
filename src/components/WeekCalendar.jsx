import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export default function WeekCalendar({ customers }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    const dayOfWeek = monday.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(monday.getDate() + diff + weekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekOffset]);

  const eventsByDay = useMemo(() => {
    const map = {};
    weekDays.forEach(d => {
      map[d.toISOString().split('T')[0]] = [];
    });

    customers.forEach(c => {
      if (!c.next_action_date) return;
      if (c.status === 'matriculado' || c.status === 'perdido') return;
      const dateKey = c.next_action_date.split('T')[0];
      if (map[dateKey]) {
        map[dateKey].push(c);
      }
    });

    return map;
  }, [customers, weekDays]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const totalEvents = Object.values(eventsByDay).reduce((sum, arr) => sum + arr.length, 0);
  const weekLabel = `${weekDays[0].getDate()} ${monthNames[weekDays[0].getMonth()]} — ${weekDays[6].getDate()} ${monthNames[weekDays[6].getMonth()]}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-orange-500" />
            Agenda da Semana
          </p>
          <p className="text-sm text-gray-400">{weekLabel} • {totalEvents} compromisso(s)</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setWeekOffset(0)} className="px-3 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-500">
            Hoje
          </button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const dateKey = day.toISOString().split('T')[0];
          const events = eventsByDay[dateKey] || [];
          const isToday = day.getTime() === today.getTime();
          const isPast = day < today && !isToday;

          return (
            <div key={i} className={`rounded-xl border p-2 min-h-36 ${isToday ? 'border-orange-300 bg-orange-50/50' : isPast ? 'border-gray-100 bg-gray-50/50' : 'border-gray-100'}`}>
              <div className="text-center mb-1.5">
                <p className="text-xs text-gray-400">{dayNames[i]}</p>
                <p className={`text-sm font-semibold ${isToday ? 'text-orange-600' : isPast ? 'text-gray-300' : 'text-gray-700'}`}>{day.getDate()} {monthNames[day.getMonth()]}</p>
              </div>
              <div className="space-y-1">
                {events.slice(0, 3).map(c => (
                  <Link key={c.id} to={`/cliente/${c.id}`} className={`block text-xs p-1.5 rounded-lg truncate hover:bg-orange-100 transition-colors ${isToday ? 'bg-white/70' : 'bg-orange-50'}`}>
                    <p className="font-medium text-gray-700 truncate">{c.name}</p>
                    <p className="text-gray-400 truncate">{c.next_action}</p>
                  </Link>
                ))}
                {events.length > 3 && <p className="text-xs text-gray-400 text-center pt-0.5">+{events.length - 3}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {totalEvents === 0 && (
        <div className="text-center py-8 text-sm text-gray-300">
          Nenhum compromisso agendado para esta semana.
        </div>
      )}
    </div>
  );
}
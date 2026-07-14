import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Download } from 'lucide-react';

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

  const exportICS = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekDays[6]); weekEnd.setHours(23, 59, 59, 999);
    const events = [];

    customers.forEach(c => {
      if (!c.next_action_date) return;
      if (c.status === 'matriculado' || c.status === 'perdido') return;
      const d = new Date(c.next_action_date);
      if (d < today || d > weekEnd) return;
      const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
      events.push(
        `BEGIN:VEVENT\nUID:${c.id}@befitness\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nDTSTART;VALUE=DATE:${dateStr}\nSUMMARY:${c.name} — ${c.next_action || 'Atendimento'}\nDESCRIPTION:Cliente: ${c.name}\\\\nAção: ${c.next_action || 'Atendimento'}\\\\nTelefone: ${c.phone || 'N/A'}\nEND:VEVENT`
      );
    });

    if (events.length === 0) return;
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Be Fitness//Agenda//PT\n${events.join('\n')}\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agenda-befitness.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-orange-500" />
            Agenda da Semana
          </p>
          <p className="text-sm text-muted-foreground">{weekLabel} • {totalEvents} compromisso(s)</p>
        </div>
        <div className="flex gap-1">
          <button onClick={exportICS} className="px-3 h-8 rounded-lg border border-border hover:bg-secondary text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Download className="w-3 h-3" />
            Exportar
          </button>
          <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-lg border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setWeekOffset(0)} className="px-3 h-8 rounded-lg border border-border hover:bg-secondary text-xs font-medium text-muted-foreground">
            Hoje
          </button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-lg border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground">
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
            <div key={i} className={`rounded-xl border p-2 min-h-36 ${isToday ? 'border-orange-500/40 bg-orange-500/10' : isPast ? 'border-border bg-secondary/50' : 'border-border'}`}>
              <div className="text-center mb-1.5">
                <p className="text-xs text-muted-foreground">{dayNames[i]}</p>
                <p className={`text-sm font-semibold ${isToday ? 'text-orange-400' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>{day.getDate()} {monthNames[day.getMonth()]}</p>
              </div>
              <div className="space-y-1">
                {events.slice(0, 3).map(c => (
                  <Link key={c.id} to={`/cliente/${c.id}`} className={`block text-xs p-1.5 rounded-lg truncate hover:bg-orange-500/20 transition-colors ${isToday ? 'bg-card/70' : 'bg-orange-500/10'}`}>
                    <p className="font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-muted-foreground truncate">{c.next_action}</p>
                  </Link>
                ))}
                {events.length > 3 && <p className="text-xs text-muted-foreground text-center pt-0.5">+{events.length - 3}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {totalEvents === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Nenhum compromisso agendado para esta semana.
        </div>
      )}
    </div>
  );
}
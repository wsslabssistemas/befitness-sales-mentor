import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Users, MessageSquare, BookOpen, BarChart3, FileText, Clock, Download } from 'lucide-react';
import DigitalClock from './DigitalClock';

const LOGO_URL = 'https://media.base44.com/images/public/6a4e5171867839bd68b9280e/632f9e5d1_WhatsAppImage2026-07-08at123414.jpeg';

const navItems = [
  { to: '/', label: 'Clientes', icon: Users, end: true },
  { to: '/atendimento', label: 'Atendimento', icon: MessageSquare, end: false },
  { to: '/biblioteca', label: 'Biblioteca', icon: BookOpen, end: false },
  { to: '/indicadores', label: 'Indicadores', icon: BarChart3, end: false },
  { to: '/relatorio-mensal', label: 'Relatório Mensal', icon: FileText, end: false },
  { to: '/resumo-diario', label: 'Resumo Diário', icon: Clock, end: false },
];

export default function Sidebar() {
  const [overdueCount, setOverdueCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const customers = await base44.entities.Customer.list('-created_date', 200);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const count = customers.filter(c => {
          if (c.status === 'matriculado' || c.status === 'perdido') return false;
          if (!c.next_action_date) return false;
          return new Date(c.next_action_date) < today;
        }).length;
        setOverdueCount(count);
      } catch (e) { console.error(e); }
    };
    loadCount();
    const unsubscribe = base44.entities.Customer.subscribe(() => loadCount());
    return unsubscribe;
  }, []);

  return (
    <aside className="w-16 lg:w-64 flex-shrink-0 flex flex-col h-screen sticky top-0 z-10" style={{background: 'hsl(229,25%,6%)', borderRight: '1px solid hsl(229,20%,13%)'}}>
      <div className="p-4 lg:p-6 flex items-center gap-3" style={{borderBottom: '1px solid hsl(229,20%,11%)'}}>
        <img src={LOGO_URL} alt="Be Fitness" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 ring-2 ring-orange-500/20" />
        <div className="hidden lg:block">
          <p className="font-bold text-white text-sm leading-tight">Be Fitness</p>
          <p className="text-xs" style={{color:'hsl(220,10%,45%)'}}>Assistente Comercial</p>
        </div>
      </div>
      <nav className="flex-1 px-2 lg:px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline flex-1">{label}</span>
            {to === '/' && overdueCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                {overdueCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      {!isInstalled && (
        <div className="px-2 lg:px-3 pb-2" style={{borderTop: '1px solid hsl(229,20%,11%)', paddingTop: '8px'}}>
          {installPrompt ? (
            <button
              onClick={async () => {
                installPrompt.prompt();
                const { outcome } = await installPrompt.userChoice;
                if (outcome === 'accepted') { setInstallPrompt(null); setIsInstalled(true); }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-all"
            >
              <Download className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:inline">Instalar App</span>
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500">
              <Download className="w-4 h-4 flex-shrink-0" />
              <span>Abra no Chrome/Edge para instalar como app</span>
            </div>
          )}
        </div>
      )}
      <div className="hidden lg:block" style={{borderTop: '1px solid hsl(229,20%,11%)'}}>
        <DigitalClock />
      </div>
    </aside>
  );
}
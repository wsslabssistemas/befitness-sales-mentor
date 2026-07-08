import { NavLink } from 'react-router-dom';
import { Users, MessageSquare, BookOpen, BarChart3, Dumbbell } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Clientes', icon: Users, end: true },
  { to: '/atendimento', label: 'Atendimento', icon: MessageSquare, end: false },
  { to: '/biblioteca', label: 'Biblioteca', icon: BookOpen, end: false },
  { to: '/indicadores', label: 'Indicadores', icon: BarChart3, end: false },
];

export default function Sidebar() {
  return (
    <aside className="w-16 lg:w-64 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col h-screen sticky top-0 z-10">
      <div className="p-4 lg:p-6 flex items-center gap-2.5 border-b border-gray-50">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div className="hidden lg:block">
          <p className="font-bold text-gray-900 text-sm leading-tight">Be Fitness</p>
          <p className="text-xs text-gray-400">Assistente Comercial</p>
        </div>
      </div>
      <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-50 hidden lg:block">
        <p className="text-xs text-gray-300 text-center">V1 • Método Comercial</p>
      </div>
    </aside>
  );
}
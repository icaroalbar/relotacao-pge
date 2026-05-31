import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, Map, Briefcase,
  UserCheck, Star, CheckSquare, History, FileText,
} from 'lucide-react'
import { useCicloAtual } from '../api/ciclos'

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',         icon: LayoutDashboard },
  { to: '/areas',      label: 'Áreas & Vagas',      icon: Building2 },
  { to: '/procuradores', label: 'Procuradores',     icon: Users },
  { to: '/mapa',       label: 'Mapa de Relotação',  icon: Map },
  { to: '/nomeacoes',  label: 'Nomeações',           icon: Briefcase },
  { to: '/escolhas',   label: 'Escolha dos Chefes', icon: UserCheck },
  { to: '/designacoes', label: 'Designações PG',    icon: Star },
  { to: '/encerrar',   label: 'Encerrar Ciclo',     icon: CheckSquare },
  { to: '/historico',  label: 'Histórico',          icon: History },
  { to: '/relatorios', label: 'Relatórios',         icon: FileText },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: ciclo } = useCicloAtual()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-800 text-slate-100 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-700">
          <h1 className="font-bold text-sm leading-tight">Relotação</h1>
          <p className="text-slate-400 text-xs">PGE-RJ</p>
        </div>

        {ciclo && (
          <div className="px-4 py-2 bg-slate-700 text-xs">
            <span className="text-slate-400">Ciclo ativo: </span>
            <span className="font-semibold text-blue-300">{ciclo.id}</span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

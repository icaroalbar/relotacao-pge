import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, Map, Briefcase,
  UserCheck, Star, Layers, CheckSquare, History, FileText, PlusCircle,
} from 'lucide-react'
import { useCicloAtual } from '../api/ciclos'

const NAV_GROUPS = [
  {
    label: 'Visualização',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { to: '/areas',        label: 'Áreas & Vagas',   icon: Building2 },
      { to: '/procuradores', label: 'Procuradores',    icon: Users },
    ],
  },
  {
    label: 'Decisões',
    items: [
      { to: '/designacoes', label: 'Designações PG',     icon: Star },
      { to: '/nomeacoes',   label: 'Nomeações',           icon: Briefcase },
      { to: '/escolhas',    label: 'Escolha dos Chefes', icon: UserCheck },
      { to: '/alocar',      label: 'Alocar Acervo',      icon: Layers },
      { to: '/mapa',        label: 'Mapa da Relotação',  icon: Map },
    ],
  },
  {
    label: 'Ciclos',
    items: [
      { to: '/novo-ciclo',  label: 'Criar novo',     icon: PlusCircle },
      { to: '/encerrar',    label: 'Encerrar Ciclo', icon: CheckSquare },
      { to: '/historico',   label: 'Histórico',      icon: History },
      { to: '/relatorios',  label: 'Relatórios',     icon: FileText },
    ],
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: ciclo } = useCicloAtual()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar PGE */}
      <aside className="w-60 flex flex-col shrink-0" style={{ backgroundColor: '#005A92' }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-0.5">Sistema de</p>
          <h1 className="font-sans font-bold text-xl leading-tight text-white">
            Relotação
          </h1>
          <p className="text-white/50 text-xs mt-0.5">PGE-RJ</p>
        </div>

        {/* Ciclo ativo */}
        {ciclo && (
          <div className="mx-3 my-2 px-3 py-2 rounded-md bg-white/10 border border-white/20">
            <p className="text-white/50 text-xs">Ciclo ativo</p>
            <p className="text-white font-semibold text-sm">{ciclo.id}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_GROUPS.map(({ label: groupLabel, items }) => (
            <div key={groupLabel} className="mb-1">
              <p className="mx-4 mt-3 mb-1 text-white/35 text-[10px] font-semibold tracking-widest uppercase">
                {groupLabel}
              </p>
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`
                  }
                  style={({ isActive }) => isActive ? { backgroundColor: '#BB9B32' } : {}}
                >
                  <Icon size={15} className="shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-white/30 text-xs">Procuradoria-Geral do Estado</p>
          <p className="text-white/20 text-xs">Rio de Janeiro</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}

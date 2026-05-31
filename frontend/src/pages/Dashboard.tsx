import { CheckCircle, Circle, Clock, AlertTriangle, Upload, UserCheck, Play } from 'lucide-react'
import { useCicloAtual } from '../api/ciclos'
import { useProcuradores } from '../api/procuradores'
import { useAreas } from '../api/areas'
import Spinner from '../components/Spinner'
import { useNavigate } from 'react-router-dom'

// ── Stepper ──────────────────────────────────────────────────────────────────

const ETAPAS = [
  { label: 'Configurar Áreas e Vagas' },
  { label: 'Nomeações da Gestão' },
  { label: 'Importar Preferências' },
  { label: 'Escolha dos Chefes' },
  { label: 'Processar Alocação' },
]

function Stepper({ etapaAtual }: { etapaAtual: number }) {
  return (
    <div className="bg-white border rounded-lg px-6 py-4">
      <div className="flex items-center gap-0">
        {ETAPAS.map((e, i) => {
          const done = i < etapaAtual
          const active = i === etapaAtual
          return (
            <div key={i} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 ${
                  done   ? 'border-pge-green bg-pge-green text-white' :
                  active ? 'border-pge-blue bg-pge-blue text-white' :
                           'border-gray-300 bg-white text-gray-400'
                }`}>
                  {done ? <CheckCircle size={14} /> : i + 1}
                </div>
                <p className={`text-center text-xs leading-tight px-1 ${
                  active ? 'font-semibold text-pge-blue' :
                  done   ? 'text-pge-green' :
                           'text-gray-400'
                }`}>
                  {active && <span className="block text-[10px] text-pge-gold uppercase tracking-wide">Em andamento</span>}
                  {e.label}
                </p>
              </div>
              {i < ETAPAS.length - 1 && (
                <div className={`h-0.5 w-6 mx-1 shrink-0 mt-[-18px] ${done ? 'bg-pge-green' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent = false,
}: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white border rounded-lg p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ? 'text-pge-gold' : 'text-pge-blue'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Composição das vagas (barra horizontal) ──────────────────────────────────

function ComposicaoVagas({ areas }: { areas: { vagas_nomeacao: number; vagas_escolha: number; vagas_acervo: number; vagas_pg: number; vagas_designacao: number }[] }) {
  const nom = areas.reduce((s, a) => s + a.vagas_nomeacao, 0)
  const esc = areas.reduce((s, a) => s + a.vagas_escolha, 0)
  const acv = areas.reduce((s, a) => s + a.vagas_acervo, 0)
  const des = areas.reduce((s, a) => s + a.vagas_designacao, 0)
  const total = nom + esc + acv + des

  const bars = [
    { label: 'Livre Nomeação · Gestão', value: nom, color: '#C0392B' },
    { label: 'Escolha dos Chefes',      value: esc, color: '#427942' },
    { label: 'Designação PG',           value: des, color: '#BB9B32' },
    { label: 'Acervo',                  value: acv, color: '#005A92' },
  ]

  return (
    <div className="bg-white border rounded-lg p-5">
      <h3 className="font-semibold text-gray-700 mb-4">Composição das vagas</h3>
      <div className="space-y-3">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                {b.label}
              </span>
              <span className="font-semibold">{b.value}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${total ? (b.value / total) * 100 : 0}%`, backgroundColor: b.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t flex justify-between">
        <span className="text-sm text-gray-500">Total de vagas</span>
        <span className="font-bold text-pge-blue text-lg">{total}</span>
      </div>
    </div>
  )
}

// ── Próximas ações ────────────────────────────────────────────────────────────

function ProximasAcoes({ areas, procs, cicloId }: {
  areas: { vagas_escolha: number }[]
  procs: { preferencias: unknown[] }[]
  cicloId: string
}) {
  const navigate = useNavigate()
  const semPrefs = procs.filter(p => (p.preferencias as unknown[]).length === 0).length
  const escolhasPendentes = areas.reduce((s, a) => s + a.vagas_escolha, 0)

  const acoes = [
    semPrefs > 0 && {
      icon: Upload,
      label: `${semPrefs} procuradores sem preferências`,
      sub: 'Importar planilha de preferências',
      to: '/nomeacoes',
      btn: 'Importar',
    },
    escolhasPendentes > 0 && {
      icon: UserCheck,
      label: `${escolhasPendentes} escolhas de chefes pendentes`,
      sub: 'Aguardando indicação dos slots verdes',
      to: '/escolhas',
      btn: 'Acompanhar',
    },
    {
      icon: Play,
      label: 'Pré-simulação disponível',
      sub: 'Rodar com dados parciais para projetar resultado',
      to: '/encerrar',
      btn: 'Simular',
    },
  ].filter(Boolean) as { icon: typeof Play; label: string; sub: string; to: string; btn: string }[]

  if (!acoes.length) return null

  return (
    <div className="bg-white border rounded-lg p-5">
      <h3 className="font-semibold text-gray-700 mb-3">Próximas ações</h3>
      <div className="space-y-3">
        {acoes.map((a, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex items-center gap-3">
              <a.icon size={16} className="text-pge-blue shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">{a.label}</p>
                <p className="text-xs text-gray-400">{a.sub}</p>
              </div>
            </div>
            <button onClick={() => navigate(a.to)}
              className="text-xs border border-pge-blue text-pge-blue px-3 py-1.5 rounded hover:bg-pge-blue hover:text-white transition-colors shrink-0 ml-4">
              {a.btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: ciclo, isLoading } = useCicloAtual()
  const { data: procs } = useProcuradores()
  const { data: areas } = useAreas()

  if (isLoading) return <Spinner />

  const totalProcs = procs?.length ?? 0
  const ativos = procs?.filter(p => p.ativo).length ?? 0
  const afastados = totalProcs - ativos
  const totalVagas = areas?.reduce((s, a) => s + a.total_vagas, 0) ?? 0
  const saldo = totalProcs - totalVagas
  const semPrefs = procs?.filter(p => p.preferencias.length === 0).length ?? 0
  const formularios = totalProcs - semPrefs

  // Etapa atual
  const etapaAtual =
    !areas?.length ? 0 :
    !ciclo ? 0 :
    formularios === 0 ? 2 :
    formularios < totalProcs ? 2 :
    3

  return (
    <div className="p-8 max-w-6xl">
      {/* Banner ciclo */}
      {ciclo ? (
        <div className="mb-6 flex items-start gap-3 bg-pge-blue-light border border-pge-blue/30 rounded-lg px-4 py-3 text-sm">
          <Clock size={16} className="text-pge-blue mt-0.5 shrink-0" />
          <p className="text-pge-blue">
            <strong>Ciclo {ciclo.id} em andamento</strong> — aberto em{' '}
            {new Date(ciclo.abertura).toLocaleDateString('pt-BR')}.
            Após o encerramento, o sistema executará a alocação automática
            considerando preferências, antiguidade e decisões manuais da gestão.
          </p>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <p className="text-amber-700">Nenhum ciclo ativo. Crie um novo ciclo em <strong>Encerrar Ciclo</strong>.</p>
        </div>
      )}

      {/* Stepper */}
      <div className="mb-6">
        <Stepper etapaAtual={etapaAtual} />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Procuradores" value={totalProcs}
          sub={afastados > 0 ? `Ativos no ciclo · ${afastados} afastados` : `${ativos} ativos no ciclo`} />
        <StatCard label="Áreas no Ciclo" value={areas?.length ?? 0}
          sub={`${areas?.filter(a => a.tipo === 'ESPECIALIZADA').length ?? 0} especializadas · ${areas?.filter(a => a.tipo === 'REGIONAL').length ?? 0} regionais`} />
        <StatCard label="Formulários Respondidos" value={`${formularios}/${totalProcs}`}
          sub={`${totalProcs > 0 ? Math.round(formularios / totalProcs * 100) : 0}% de adesão`}
          accent />
        <div className={`bg-white border rounded-lg p-5 ${saldo < 0 ? 'border-red-300' : ''}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Saldo Orçamentário</p>
          <p className={`text-3xl font-bold mt-1 ${saldo < 0 ? 'text-red-600' : 'text-pge-green'}`}>
            {saldo >= 0 ? `+${saldo}` : saldo}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {saldo < 0 ? '⚠ Excedente — revisar vagas' : `${totalVagas} vagas configuradas`}
          </p>
        </div>
      </div>

      {/* Composição + Próximas ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {areas && areas.length > 0 && <ComposicaoVagas areas={areas} />}
        {ciclo && procs && areas && (
          <ProximasAcoes areas={areas} procs={procs} cicloId={ciclo.id} />
        )}
      </div>

      {/* Tabela status por área */}
      <div className="bg-white border rounded-lg">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Status por área</h2>
          <span className="text-xs text-gray-400">{areas?.length ?? 0} áreas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Código', 'Nome', 'Tipo', 'Nom.', 'Esc.', 'Des.', 'Acervo', 'Total'].map(h => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {areas?.map(a => (
                <tr key={a.codigo} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs font-bold text-pge-blue">{a.codigo}</td>
                  <td className="px-4 py-2 text-xs">{a.nome}</td>
                  <td className="px-4 py-2 text-xs text-gray-400">{a.tipo}</td>
                  <td className="px-4 py-2 text-center text-xs" style={{ color: '#C0392B' }}>{a.vagas_nomeacao || '–'}</td>
                  <td className="px-4 py-2 text-center text-xs" style={{ color: '#427942' }}>{a.vagas_escolha || '–'}</td>
                  <td className="px-4 py-2 text-center text-xs" style={{ color: '#BB9B32' }}>{a.vagas_designacao || '–'}</td>
                  <td className="px-4 py-2 text-center text-xs" style={{ color: '#005A92' }}>{a.vagas_acervo || '–'}</td>
                  <td className="px-4 py-2 text-center text-xs font-bold">{a.total_vagas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

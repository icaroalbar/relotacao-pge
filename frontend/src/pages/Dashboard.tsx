import { useCicloAtual, useCiclos } from '../api/ciclos'
import { useProcuradores } from '../api/procuradores'
import { useAreas } from '../api/areas'
import Spinner from '../components/Spinner'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { data: ciclo, isLoading: loadingCiclo } = useCicloAtual()
  const { data: procs } = useProcuradores()
  const { data: areas } = useAreas()

  if (loadingCiclo) return <Spinner />

  const totalVagas = areas?.reduce((s, a) => s + a.total_vagas, 0) ?? 0
  const totalProcs = procs?.length ?? 0
  const lotados = procs?.filter(p => p.status === 'LOTADO').length ?? 0
  const pendentes = procs?.filter(p => p.status === 'PENDENTE').length ?? 0
  const licenca = procs?.filter(p => p.status === 'EM_LICENCA').length ?? 0
  const saldo = totalProcs - totalVagas

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {ciclo ? (
          <p className="text-gray-500 mt-1">
            Ciclo <span className="font-semibold text-blue-600">{ciclo.id}</span> em curso desde{' '}
            {new Date(ciclo.abertura).toLocaleDateString('pt-BR')}
          </p>
        ) : (
          <p className="text-amber-600 mt-1">Nenhum ciclo ativo</p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Procuradores" value={totalProcs} />
        <StatCard label="Total de Vagas" value={totalVagas} />
        <StatCard
          label="Saldo Orçamentário"
          value={saldo >= 0 ? `+${saldo}` : saldo}
          sub={saldo < 0 ? 'EXCEDENTE — revisar vagas' : 'folga disponível'}
        />
        <StatCard label="Áreas" value={areas?.length ?? 0} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Lotados" value={lotados} />
        <StatCard label="Pendentes" value={pendentes} />
        <StatCard label="Em Licença" value={licenca} />
        <StatCard label="Vacância" value={(procs?.filter(p => p.status === 'VACANCIA').length ?? 0)} />
      </div>

      {ciclo && (ciclo.movimentacoes != null) && (
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Métricas do último encerramento</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Movimentações</p>
              <p className="text-xl font-bold">{ciclo.movimentacoes}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Permanências</p>
              <p className="text-xl font-bold">{ciclo.permanencias}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">% 1ª Preferência</p>
              <p className="text-xl font-bold">{ciclo.pct_primeira_pref?.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white border rounded-lg">
        <div className="px-5 py-3 border-b">
          <h2 className="font-semibold text-gray-700">Status por área</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Código</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Tipo</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Total Vagas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {areas?.map(a => (
                <tr key={a.codigo} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{a.codigo}</td>
                  <td className="px-4 py-2">{a.nome}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{a.tipo}</td>
                  <td className="px-4 py-2 text-right font-semibold">{a.total_vagas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

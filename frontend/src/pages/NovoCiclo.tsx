import { useState } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import { useCicloAtual, useCreateCiclo } from '../api/ciclos'
import { useGerarVagas } from '../api/vagas'
import { useAreas } from '../api/areas'
import { useProcuradores } from '../api/procuradores'
import Spinner from '../components/Spinner'

export default function NovoCiclo() {
  const { data: ciclo, isLoading } = useCicloAtual()
  const { data: areas } = useAreas()
  const { data: procs } = useProcuradores()
  const createCiclo = useCreateCiclo()
  const gerarVagas = useGerarVagas()

  const [novoCicloId, setNovoCicloId] = useState('')
  const [abertura, setAbertura] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState('')

  if (isLoading) return <Spinner />

  const totalVagas = areas?.reduce((s, a) => s + a.total_vagas, 0) ?? 0
  const totalProcs = procs?.length ?? 0
  const saldo = totalProcs - totalVagas

  async function handleCreate() {
    if (!novoCicloId.trim()) return
    setError('')
    setSucesso('')
    try {
      const c = await createCiclo.mutateAsync({ id: novoCicloId.trim(), abertura })
      await gerarVagas.mutateAsync(c.id)
      setSucesso(`Ciclo ${c.id} criado com sucesso.`)
      setNovoCicloId('')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Erro ao criar ciclo'
      setError(msg)
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar novo ciclo</h1>

      {/* saldo */}
      <div className={`mb-6 p-4 rounded-lg border ${
        saldo === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <p className="text-sm font-medium">
          {totalProcs} procuradores · {totalVagas} vagas ·{' '}
          saldo{' '}
          <strong className={saldo === 0 ? 'text-green-700' : 'text-amber-700'}>
            {saldo > 0 ? `+${saldo}` : saldo}
          </strong>
        </p>
      </div>

      {ciclo ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex gap-3 items-start">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 text-sm">Já existe um ciclo ativo: <strong>{ciclo.id}</strong></p>
            <p className="text-xs text-amber-700 mt-1">Encerre o ciclo atual antes de criar um novo.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ID do ciclo</label>
              <input
                value={novoCicloId}
                onChange={e => setNovoCicloId(e.target.value)}
                placeholder="ex: 2026.1"
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data de abertura</label>
              <input
                type="date"
                value={abertura}
                onChange={e => setAbertura(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {sucesso && <p className="text-green-600 text-sm mb-3">{sucesso}</p>}
          <button
            onClick={handleCreate}
            disabled={!novoCicloId.trim() || createCiclo.isPending}
            className="flex items-center gap-2 bg-[#005A92] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#004470] disabled:opacity-40"
          >
            <Plus size={16} /> Criar ciclo e gerar vagas
          </button>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { AlertTriangle, Play, Square, Plus } from 'lucide-react'
import { useCicloAtual, useCreateCiclo, useAlocarAcervo, useEncerrarCiclo } from '../api/ciclos'
import { useGerarVagas } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import { useAreas } from '../api/areas'
import Spinner from '../components/Spinner'
import Badge from '../components/Badge'

export default function EncerrarCiclo() {
  const { data: ciclo, isLoading } = useCicloAtual()
  const { data: procs } = useProcuradores()
  const { data: areas } = useAreas()

  const createCiclo = useCreateCiclo()
  const gerarVagas = useGerarVagas()
  const alocar = useAlocarAcervo()
  const encerrar = useEncerrarCiclo()

  const [novoCicloId, setNovoCicloId] = useState('')
  const [abertura, setAbertura] = useState(new Date().toISOString().slice(0, 10))
  const [alocResult, setAlocResult] = useState<{ alocados: number; sem_vaga: number[] } | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState('')

  if (isLoading) return <Spinner />

  const totalVagas = areas?.reduce((s, a) => s + a.total_vagas, 0) ?? 0
  const totalProcs = procs?.length ?? 0
  const saldo = totalProcs - totalVagas
  const orcamentOk = saldo >= 0

  async function handleCreateCiclo() {
    if (!novoCicloId.trim()) return
    try {
      const c = await createCiclo.mutateAsync({ id: novoCicloId.trim(), abertura })
      await gerarVagas.mutateAsync(c.id)
      setNovoCicloId('')
      setError('')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Erro ao criar ciclo'
      setError(msg)
    }
  }

  async function handleAlocar() {
    if (!ciclo) return
    const r = await alocar.mutateAsync(ciclo.id)
    setAlocResult(r)
  }

  async function handleEncerrar() {
    if (!ciclo) return
    await encerrar.mutateAsync(ciclo.id)
    setConfirmando(false)
    setAlocResult(null)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ciclo</h1>

      {/* orçamento */}
      <div className={`mb-6 p-4 rounded-lg border ${orcamentOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          {!orcamentOk && <AlertTriangle size={16} className="text-red-500" />}
          <span className="font-medium text-sm">
            Orçamento: {totalProcs} procuradores / {totalVagas} vagas — saldo{' '}
            <strong className={orcamentOk ? 'text-green-700' : 'text-red-700'}>
              {saldo >= 0 ? `+${saldo}` : saldo}
            </strong>
          </span>
        </div>
        {!orcamentOk && <p className="text-xs text-red-600 mt-1">Excedente de vagas. Ajuste em Áreas & Vagas antes de encerrar.</p>}
      </div>

      {!ciclo ? (
        /* Criar novo ciclo */
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-4">Criar novo ciclo</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ID do ciclo</label>
              <input value={novoCicloId} onChange={e => setNovoCicloId(e.target.value)}
                placeholder="ex: 2026.1"
                className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data de abertura</label>
              <input type="date" value={abertura} onChange={e => setAbertura(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button onClick={handleCreateCiclo} disabled={!novoCicloId.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40">
            <Plus size={16} /> Criar ciclo e gerar vagas
          </button>
        </div>
      ) : (
        /* Ciclo ativo */
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Ciclo ativo: <span className="text-blue-600">{ciclo.id}</span></h2>
                <p className="text-xs text-gray-500 mt-1">
                  Aberto em {new Date(ciclo.abertura).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700">{ciclo.status}</Badge>
            </div>

            {/* Passo 1: Alocar acervo */}
            <div className="border rounded p-4 mb-3">
              <h3 className="font-medium text-sm mb-2">Passo 1 — Executar alocação de acervo (R2)</h3>
              <p className="text-xs text-gray-500 mb-3">
                Serial Dictatorship por antiguidade. Idempotente — pode rodar múltiplas vezes.
              </p>
              <button onClick={handleAlocar} disabled={alocar.isPending}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-40">
                <Play size={14} /> {alocar.isPending ? 'Alocando...' : 'Alocar acervo'}
              </button>
              {alocResult && (
                <div className="mt-3 text-sm">
                  <p className="text-green-700">✓ {alocResult.alocados} procuradores alocados</p>
                  {alocResult.sem_vaga.length > 0 && (
                    <p className="text-amber-600 mt-1">
                      ⚠ {alocResult.sem_vaga.length} sem vaga disponível
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Passo 2: Encerrar */}
            <div className="border rounded p-4">
              <h3 className="font-medium text-sm mb-2">Passo 2 — Encerrar ciclo</h3>
              <p className="text-xs text-gray-500 mb-3">
                Congela snapshot, gera histórico de lotações e calcula métricas. Irreversível.
              </p>
              {!confirmando ? (
                <button onClick={() => setConfirmando(true)} disabled={!orcamentOk}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-40">
                  <Square size={14} /> Encerrar ciclo
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-700 font-medium text-sm mb-3">
                    Confirmar encerramento do ciclo <strong>{ciclo.id}</strong>?
                    Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={handleEncerrar} disabled={encerrar.isPending}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-40">
                      {encerrar.isPending ? 'Encerrando...' : 'Confirmar encerramento'}
                    </button>
                    <button onClick={() => setConfirmando(false)} className="border px-4 py-2 rounded text-sm hover:bg-gray-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

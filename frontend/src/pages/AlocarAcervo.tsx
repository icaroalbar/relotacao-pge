import { useState } from 'react'
import { Play, RefreshCw } from 'lucide-react'
import { useCicloAtual, useAlocarAcervo } from '../api/ciclos'
import { useVagas } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import Spinner from '../components/Spinner'

export default function AlocarAcervo() {
  const { data: ciclo, isLoading } = useCicloAtual()
  const { data: vagas } = useVagas(ciclo ? { ciclo_id: ciclo.id, tipo: 'ACERVO' } : undefined)
  const { data: procs } = useProcuradores()
  const alocar = useAlocarAcervo()

  const [resultado, setResultado] = useState<{ alocados: number; sem_vaga: number[] } | null>(null)

  if (isLoading) return <Spinner />

  if (!ciclo) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Alocar Acervo</h1>
        <p className="text-amber-600">Nenhum ciclo ativo. Crie um ciclo em <strong>Encerrar Ciclo</strong>.</p>
      </div>
    )
  }

  const vagasLivres   = (vagas ?? []).filter(v => v.ocupante_id === null).length
  const vagasOcupadas = (vagas ?? []).filter(v => v.ocupante_id !== null).length
  const totalAcervo   = (vagas ?? []).length
  const pendentes     = (procs ?? []).filter(p => p.ativo && p.status === 'PENDENTE').length

  async function handleAlocar() {
    const r = await alocar.mutateAsync(ciclo!.id)
    setResultado(r)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alocar Acervo</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ciclo <strong className="text-[#005A92]">{ciclo.id}</strong> — preenchimento automático das vagas azuis
        </p>
      </div>

      {/* Situação atual */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total acervo</p>
          <p className="text-2xl font-bold text-[#005A92] mt-1">{totalAcervo}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Ocupadas</p>
          <p className="text-2xl font-bold text-[#427942] mt-1">{vagasOcupadas}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Livres</p>
          <p className={`text-2xl font-bold mt-1 ${vagasLivres > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {vagasLivres}
          </p>
        </div>
      </div>

      {pendentes > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <span>⚠</span>
          <span><strong>{pendentes}</strong> procuradores ativos ainda sem vaga alocada.</span>
        </div>
      )}

      {/* Explicação */}
      <div className="bg-white border rounded-lg p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Como funciona</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#005A92] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
            <p>Percorre os procuradores em ordem crescente de antiguidade (mais antigo primeiro).</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#005A92] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
            <p>Cada procurador ocupa a primeira área da sua lista de preferências que ainda tem vaga azul livre.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#005A92] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
            <p>Procuradores em licença ou vacância não participam — suas vagas entram no pool.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#BB9B32] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">!</span>
            <p><strong>Idempotente:</strong> pode rodar quantas vezes quiser. Apenas vagas automáticas são recalculadas — vagas editadas manualmente são preservadas.</p>
          </div>
        </div>
      </div>

      {/* Botão */}
      <div className="bg-white border rounded-lg p-5">
        <button
          onClick={handleAlocar}
          disabled={alocar.isPending}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
          style={{ backgroundColor: '#005A92' }}
        >
          {alocar.isPending
            ? <><RefreshCw size={16} className="animate-spin" /> Alocando...</>
            : <><Play size={16} /> Alocar acervo automaticamente</>
          }
        </button>

        {/* Resultado */}
        {resultado && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-[#427942]">
              <span>✓</span>
              <span><strong>{resultado.alocados}</strong> procuradores alocados nas vagas azuis</span>
            </div>
            {resultado.sem_vaga.length > 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <span>⚠</span>
                <span>
                  <strong>{resultado.sem_vaga.length}</strong> sem vaga disponível —
                  todas as suas preferências estavam ocupadas ou sem preferências cadastradas.
                  Alocar manualmente no <strong>Mapa de Relotação</strong>.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

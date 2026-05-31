import { useState } from 'react'
import { AlertTriangle, Play, Square, Plus, CheckCircle } from 'lucide-react'
import { useCicloAtual, useCreateCiclo, useAlocarAcervo, useEncerrarCiclo } from '../api/ciclos'
import { useGerarVagas, useVagas } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import { useAreas } from '../api/areas'
import Spinner from '../components/Spinner'
import Badge from '../components/Badge'

export default function EncerrarCiclo() {
  const { data: ciclo, isLoading } = useCicloAtual()
  const { data: procs } = useProcuradores()
  const { data: areas } = useAreas()
  const { data: vagas } = useVagas(ciclo ? { ciclo_id: ciclo.id } : undefined)

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

  // Contagens para avisos
  const vagasSemOcupante = (vagas ?? []).filter(v => v.ocupante_id === null).length
  const procsNaoAlocados = (procs ?? []).filter(p => p.ativo && p.status === 'PENDENTE').length
  const temAviso = vagasSemOcupante > 0 || procsNaoAlocados > 0

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

      {/* banner saldo */}
      <div className={`mb-6 p-4 rounded-lg border ${
        saldo === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-2">
          {saldo === 0
            ? <CheckCircle size={16} className="text-green-600" />
            : <AlertTriangle size={16} className="text-amber-500" />
          }
          <span className="font-medium text-sm">
            Atenção: {totalProcs} procuradores / {totalVagas} vagas — saldo{' '}
            <strong className={saldo === 0 ? 'text-green-700' : 'text-amber-700'}>
              {saldo > 0 ? `+${saldo}` : saldo}
            </strong>
          </span>
        </div>
        {saldo > 0 && <p className="text-xs text-amber-700 mt-1">Há {saldo} procuradores a mais que vagas.</p>}
        {saldo < 0 && <p className="text-xs text-amber-700 mt-1">Há {Math.abs(saldo)} vagas a mais que procuradores.</p>}
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
            className="flex items-center gap-2 bg-[#005A92] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#004470] disabled:opacity-40">
            <Plus size={16} /> Criar ciclo e gerar vagas
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Ciclo ativo: <span className="text-[#005A92]">{ciclo.id}</span></h2>
                <p className="text-xs text-gray-500 mt-1">
                  Aberto em {new Date(ciclo.abertura).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700">{ciclo.status}</Badge>
            </div>

            {/* Ordem de preenchimento */}
            <div className="border rounded p-4 mb-3 bg-gray-50">
              <h3 className="font-medium text-sm mb-3 text-gray-700">Ordem de preenchimento das vagas</h3>
              <div className="space-y-2 text-xs">
                {[
                  { cor: '#A0A0A0', label: 'PG (cinza)',           desc: 'Cargo único — preencher manualmente no Mapa' },
                  { cor: '#BB9B32', label: 'Designação PG (amarelo)', desc: 'PG designa — preencher em Designações PG' },
                  { cor: '#C0392B', label: 'Nomeação (vermelho)',   desc: 'Livre nomeação da gestão — preencher em Nomeações' },
                  { cor: '#427942', label: 'Escolha dos Chefes (verde)', desc: 'Cada chefe indica — preencher em Escolha dos Chefes' },
                  { cor: '#005A92', label: 'Acervo (azul)',         desc: 'Sistema preenche automaticamente ↓' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.cor }} />
                    <span className="font-medium w-44 shrink-0">{item.label}</span>
                    <span className="text-gray-400">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alocar acervo */}
            <div className="border rounded p-4 mb-3">
              <h3 className="font-medium text-sm mb-2">Executar alocação de acervo (vagas azuis)</h3>
              <p className="text-xs text-gray-500 mb-3">
                Percorre procuradores do mais antigo ao mais novo. Cada um ocupa a 1ª área preferida com vaga azul livre.
                Idempotente — pode rodar quantas vezes quiser.
              </p>
              <button onClick={handleAlocar} disabled={alocar.isPending}
                className="flex items-center gap-2 bg-[#005A92] text-white px-4 py-2 rounded text-sm hover:bg-[#004470] disabled:opacity-40">
                <Play size={14} /> {alocar.isPending ? 'Alocando...' : 'Alocar acervo automaticamente'}
              </button>
              {alocResult && (
                <div className="mt-3 text-sm">
                  <p className="text-green-700">✓ {alocResult.alocados} procuradores alocados nas vagas azuis</p>
                  {alocResult.sem_vaga.length > 0 && (
                    <p className="text-amber-600 mt-1">
                      ⚠ {alocResult.sem_vaga.length} sem vaga disponível — alocar manualmente no Mapa
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Encerrar */}
            <div className="border rounded p-4">
              <h3 className="font-medium text-sm mb-2">Encerrar ciclo</h3>
              <p className="text-xs text-gray-500 mb-3">
                Congela snapshot, gera histórico de lotações e calcula métricas. Irreversível.
              </p>

              {!confirmando ? (
                <button onClick={() => setConfirmando(true)}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                  <Square size={14} /> Encerrar ciclo
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded p-4 space-y-3">

                  {/* Avisos contextuais */}
                  {vagasSemOcupante > 0 && (
                    <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <span>
                        Atenção: há <strong>{vagasSemOcupante}</strong> {vagasSemOcupante === 1 ? 'vaga sem procurador alocado' : 'vagas sem procuradores alocados'}.
                        Encerrar mesmo assim?
                      </span>
                    </div>
                  )}

                  {procsNaoAlocados > 0 && (
                    <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <span>
                        Atenção: há <strong>{procsNaoAlocados}</strong> {procsNaoAlocados === 1 ? 'procurador não alocado' : 'procuradores não alocados'}.
                        Encerrar mesmo assim?
                      </span>
                    </div>
                  )}

                  {!temAviso && (
                    <p className="text-red-700 font-medium text-sm">
                      Confirmar encerramento do ciclo <strong>{ciclo.id}</strong>? Esta ação não pode ser desfeita.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button onClick={handleEncerrar} disabled={encerrar.isPending}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-40">
                      {encerrar.isPending ? 'Encerrando...' : 'Confirmar encerramento'}
                    </button>
                    <button onClick={() => setConfirmando(false)}
                      className="border px-4 py-2 rounded text-sm hover:bg-gray-50">
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

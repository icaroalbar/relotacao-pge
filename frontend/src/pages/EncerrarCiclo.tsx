import { useState } from 'react'
import { AlertTriangle, Square, CheckCircle } from 'lucide-react'
import { useCicloAtual, useEncerrarCiclo } from '../api/ciclos'
import { useVagas } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import { useAreas } from '../api/areas'
import Spinner from '../components/Spinner'
import Badge from '../components/Badge'

export default function EncerrarCiclo() {
  const { data: ciclo, isLoading } = useCicloAtual()
  const { data: procs } = useProcuradores()
  const { data: areas } = useAreas()
  const { data: vagas } = useVagas(ciclo ? { ciclo_id: ciclo.id } : undefined)

  const encerrar = useEncerrarCiclo()

  const [confirmando, setConfirmando] = useState(false)

  if (isLoading) return <Spinner />

  const totalVagas = areas?.reduce((s, a) => s + a.total_vagas, 0) ?? 0
  const totalProcs = procs?.length ?? 0
  const saldo = totalProcs - totalVagas

  const vagasSemOcupante = (vagas ?? []).filter(v => v.ocupante_id === null).length
  const procsNaoAlocados = (procs ?? []).filter(p => p.ativo && p.status === 'PENDENTE').length
  const temAviso = vagasSemOcupante > 0 || procsNaoAlocados > 0

  async function handleEncerrar() {
    if (!ciclo) return
    await encerrar.mutateAsync(ciclo.id)
    setConfirmando(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Encerrar Ciclo</h1>

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
            {totalProcs} procuradores / {totalVagas} vagas — saldo{' '}
            <strong className={saldo === 0 ? 'text-green-700' : 'text-amber-700'}>
              {saldo > 0 ? `+${saldo}` : saldo}
            </strong>
          </span>
        </div>
        {saldo > 0 && <p className="text-xs text-amber-700 mt-1">Há {saldo} procuradores a mais que vagas.</p>}
        {saldo < 0 && <p className="text-xs text-amber-700 mt-1">Há {Math.abs(saldo)} vagas a mais que procuradores.</p>}
      </div>

      {!ciclo ? (
        <div className="bg-white border rounded-lg p-5 text-sm text-gray-500">
          Nenhum ciclo ativo. Crie um novo ciclo em <strong>Criar novo</strong>.
        </div>
      ) : (
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
                {vagasSemOcupante > 0 && (
                  <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>
                      Há <strong>{vagasSemOcupante}</strong> {vagasSemOcupante === 1 ? 'vaga sem procurador alocado' : 'vagas sem procuradores alocados'}.
                      Encerrar mesmo assim?
                    </span>
                  </div>
                )}
                {procsNaoAlocados > 0 && (
                  <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>
                      Há <strong>{procsNaoAlocados}</strong> {procsNaoAlocados === 1 ? 'procurador não alocado' : 'procuradores não alocados'}.
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
      )}
    </div>
  )
}

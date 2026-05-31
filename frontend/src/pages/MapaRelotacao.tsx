import { useState } from 'react'
import { useAreas } from '../api/areas'
import { useVagas, useUpdateVaga } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import { useCicloAtual } from '../api/ciclos'
import Spinner from '../components/Spinner'
import Badge from '../components/Badge'
import type { Vaga } from '../types'
import { TIPO_VAGA_COLOR, TIPO_VAGA_LABEL } from '../types'

function VagaSlot({ vaga, procMap, onEdit }: {
  vaga: Vaga
  procMap: Record<number, string>
  onEdit: (v: Vaga) => void
}) {
  const isAcervo = vaga.tipo === 'ACERVO'
  const nome = vaga.ocupante_id ? procMap[vaga.ocupante_id] : null

  return (
    <div
      className={`border rounded p-2 text-xs ${isAcervo ? 'cursor-pointer hover:border-blue-400' : ''}`}
      onClick={() => isAcervo && onEdit(vaga)}
    >
      <div className="flex items-center justify-between mb-1">
        <Badge className={TIPO_VAGA_COLOR[vaga.tipo]}>{TIPO_VAGA_LABEL[vaga.tipo]}</Badge>
        {vaga.cargo && <span className="text-gray-400 truncate ml-1">{vaga.cargo}</span>}
      </div>
      {nome
        ? <p className="font-medium text-gray-800 truncate">{nome}</p>
        : <p className="text-gray-300 italic">Vaga livre</p>}
      {vaga.origem === 'MANUAL' && isAcervo && (
        <span className="text-orange-500 text-xs">manual</span>
      )}
    </div>
  )
}

export default function MapaRelotacao() {
  const { data: ciclo, isLoading: loadingCiclo } = useCicloAtual()
  const { data: areas } = useAreas()
  const { data: vagas, isLoading: loadingVagas } = useVagas(ciclo ? { ciclo_id: ciclo.id } : undefined)
  const { data: procs } = useProcuradores()
  const updateVaga = useUpdateVaga()

  const [editVaga, setEditVaga] = useState<Vaga | null>(null)
  const [selectedProc, setSelectedProc] = useState<string>('')

  const procMap: Record<number, string> = Object.fromEntries(procs?.map(p => [p.id, p.nome]) ?? [])
  const vagasPorArea: Record<string, Vaga[]> = {}
  for (const v of vagas ?? []) {
    vagasPorArea[v.area_codigo] = [...(vagasPorArea[v.area_codigo] ?? []), v]
  }

  async function handleSaveEdit() {
    if (!editVaga) return
    await updateVaga.mutateAsync({
      id: editVaga.id,
      data: { ocupante_id: selectedProc ? Number(selectedProc) : null },
    })
    setEditVaga(null)
  }

  if (loadingCiclo || loadingVagas) return <Spinner />

  if (!ciclo) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mapa de Relotação</h1>
        <p className="text-amber-600">Nenhum ciclo ativo. Crie um ciclo em <strong>Encerrar Ciclo</strong>.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Relotação</h1>
          <p className="text-gray-500 text-sm mt-1">Ciclo <strong>{ciclo.id}</strong> — clique em vaga azul para editar</p>
        </div>
        <div className="flex gap-2 text-xs">
          {(['PG','NOMEACAO','ESCOLHA','DESIGNACAO','ACERVO'] as const).map(t => (
            <Badge key={t} className={TIPO_VAGA_COLOR[t]}>{TIPO_VAGA_LABEL[t]}</Badge>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {areas?.map(area => {
          const vagasArea = vagasPorArea[area.codigo] ?? []
          if (!vagasArea.length) return null
          return (
            <div key={area.codigo} className="bg-white border rounded-lg">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-3">
                <span className="font-mono font-bold text-sm">{area.codigo}</span>
                <span className="text-gray-700">{area.nome}</span>
                <Badge className="bg-gray-100 text-gray-600 ml-auto">{area.total_vagas} vagas</Badge>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {vagasArea.map(v => (
                  <VagaSlot key={v.id} vaga={v} procMap={procMap} onEdit={setEditVaga} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {editVaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-96 mx-4 p-5">
            <h2 className="font-semibold mb-4">
              Editar vaga — {editVaga.area_codigo} #{editVaga.numero}
              <Badge className={`ml-2 ${TIPO_VAGA_COLOR[editVaga.tipo]}`}>{TIPO_VAGA_LABEL[editVaga.tipo]}</Badge>
            </h2>
            <label className="block text-xs font-medium text-gray-700 mb-1">Procurador</label>
            <select value={selectedProc}
              onChange={e => setSelectedProc(e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm mb-4">
              <option value="">— Vaga livre —</option>
              {procs?.filter(p => p.ativo).map(p => (
                <option key={p.id} value={p.id}>
                  [{p.antiguidade}] {p.nome}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditVaga(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

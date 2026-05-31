import { useState } from 'react'
import { useAreas } from '../api/areas'
import { useVagas, useUpdateVaga } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import { useCicloAtual } from '../api/ciclos'
import Spinner from '../components/Spinner'
import type { Vaga, TipoVaga } from '../types'
import { TIPO_VAGA_LABEL } from '../types'

const TIPO_BORDER: Record<TipoVaga, string> = {
  PG:         '#A0A0A0',
  NOMEACAO:   '#C0392B',
  ESCOLHA:    '#427942',
  DESIGNACAO: '#BB9B32',
  ACERVO:     '#005A92',
}

const TIPO_BG: Record<TipoVaga, string> = {
  PG:         '#F3F4F6',
  NOMEACAO:   '#FEF2F2',
  ESCOLHA:    '#F0FDF4',
  DESIGNACAO: '#FFFBEB',
  ACERVO:     '#EFF6FF',
}

const TIPO_TEXT: Record<TipoVaga, string> = {
  PG:         '#6B7280',
  NOMEACAO:   '#C0392B',
  ESCOLHA:    '#427942',
  DESIGNACAO: '#B45309',
  ACERVO:     '#005A92',
}

function VagaCard({ vaga, procMap, onEdit }: {
  vaga: Vaga
  procMap: Record<number, string>
  onEdit: (v: Vaga) => void
}) {
  const isAcervo = vaga.tipo === 'ACERVO'
  const nome = vaga.ocupante_id ? procMap[vaga.ocupante_id] : null
  const firstName = nome?.split(' ').slice(0, 2).join(' ')

  return (
    <div
      onClick={() => isAcervo && onEdit(vaga)}
      style={{
        borderColor: TIPO_BORDER[vaga.tipo],
        backgroundColor: TIPO_BG[vaga.tipo],
        borderWidth: 2,
        borderStyle: 'solid',
        cursor: isAcervo ? 'pointer' : 'default',
      }}
      className={`rounded-lg p-2 flex flex-col items-center justify-center min-h-[90px] transition-shadow ${
        isAcervo ? 'hover:shadow-md' : ''
      }`}
    >
      {/* Número */}
      <span className="text-2xl font-bold leading-none" style={{ color: TIPO_TEXT[vaga.tipo] }}>
        {vaga.numero}
      </span>

      {/* Cargo */}
      {vaga.cargo && (
        <span className="text-[10px] text-center leading-tight mt-1 px-1"
          style={{ color: TIPO_TEXT[vaga.tipo] }}>
          {vaga.cargo}
        </span>
      )}

      {/* Ocupante */}
      {nome ? (
        <span className="text-[10px] font-medium text-gray-700 text-center leading-tight mt-1 px-1 truncate w-full text-center">
          {firstName}
        </span>
      ) : (
        <span className="text-[10px] text-gray-300 mt-1">livre</span>
      )}

      {/* Indicador manual */}
      {vaga.origem === 'MANUAL' && isAcervo && (
        <span className="text-[9px] mt-0.5" style={{ color: '#BB9B32' }}>● manual</span>
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
  const [filterArea, setFilterArea] = useState('')

  const procMap: Record<number, string> = Object.fromEntries(procs?.map(p => [p.id, p.nome]) ?? [])
  const vagasPorArea: Record<string, Vaga[]> = {}
  for (const v of vagas ?? []) {
    vagasPorArea[v.area_codigo] = [...(vagasPorArea[v.area_codigo] ?? []), v]
  }

  const areasComVagas = (areas ?? []).filter(a =>
    vagasPorArea[a.codigo]?.length &&
    (!filterArea || a.codigo === filterArea)
  )

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
        <p className="text-amber-600">Nenhum ciclo ativo.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Relotação</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ciclo <strong className="text-pge-blue">{ciclo.id}</strong> — clique em vaga azul para editar
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legenda */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {(['PG','NOMEACAO','ESCOLHA','DESIGNACAO','ACERVO'] as TipoVaga[]).map(t => (
              <span key={t} className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm border-2"
                  style={{ borderColor: TIPO_BORDER[t], backgroundColor: TIPO_BG[t] }} />
                <span style={{ color: TIPO_TEXT[t] }}>{TIPO_VAGA_LABEL[t]}</span>
              </span>
            ))}
          </div>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm">
            <option value="">Todas as áreas</option>
            {areas?.map(a => <option key={a.codigo} value={a.codigo}>{a.codigo} — {a.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {areasComVagas.map(area => {
          const vagasArea = vagasPorArea[area.codigo] ?? []
          return (
            <div key={area.codigo} className="bg-white border rounded-lg overflow-hidden">
              {/* Header área */}
              <div className="flex items-center justify-between px-4 py-3 border-b"
                style={{ backgroundColor: '#EEF4FB' }}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: '#005A92' }}>
                    {area.codigo}
                  </span>
                  <span className="font-semibold text-gray-700 text-sm">{area.nome}</span>
                  <span className="text-xs text-gray-400">{area.tipo}</span>
                </div>
                <span className="text-xs font-semibold text-gray-500">{vagasArea.length} vagas</span>
              </div>

              {/* Grid de vagas */}
              <div className="p-3 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {vagasArea
                  .sort((a, b) => {
                    const ord = ['PG','NOMEACAO','ESCOLHA','DESIGNACAO','ACERVO']
                    return ord.indexOf(a.tipo) - ord.indexOf(b.tipo) || a.numero - b.numero
                  })
                  .map(v => (
                    <VagaCard key={v.id} vaga={v} procMap={procMap}
                      onEdit={v => { setEditVaga(v); setSelectedProc(String(v.ocupante_id ?? '')) }} />
                  ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal edição vaga */}
      {editVaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-96 mx-4 p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block w-8 h-8 rounded-full text-center leading-8 text-white text-sm font-bold"
                style={{ backgroundColor: TIPO_BORDER[editVaga.tipo] }}>
                {editVaga.numero}
              </span>
              <div>
                <h2 className="font-semibold text-gray-800">Editar vaga</h2>
                <p className="text-xs text-gray-400">
                  {editVaga.area_codigo} · {TIPO_VAGA_LABEL[editVaga.tipo]}
                  {editVaga.cargo && ` · ${editVaga.cargo}`}
                </p>
              </div>
            </div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Procurador</label>
            <select value={selectedProc} onChange={e => setSelectedProc(e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm mb-4">
              <option value="">— Vaga livre —</option>
              {procs?.filter(p => p.ativo).map(p => (
                <option key={p.id} value={p.id}>[Nº {p.antiguidade}] {p.nome}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditVaga(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSaveEdit}
                className="px-4 py-2 text-sm text-white rounded"
                style={{ backgroundColor: '#005A92' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

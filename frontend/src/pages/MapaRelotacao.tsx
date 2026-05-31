import { useState } from 'react'
import { Pencil, X, Plus } from 'lucide-react'
import { useAreas } from '../api/areas'
import { useVagas, useUpdateVaga } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import { useCicloAtual } from '../api/ciclos'
import Spinner from '../components/Spinner'
import type { Vaga, TipoVaga, Procurador } from '../types'
import { TIPO_VAGA_LABEL } from '../types'

// ── cores ─────────────────────────────────────────────────────────────────────

const TIPO_BORDER: Record<TipoVaga, string> = {
  PG:         '#A0A0A0',
  NOMEACAO:   '#C0392B',
  ESCOLHA:    '#427942',
  DESIGNACAO: '#BB9B32',
  ACERVO:     '#005A92',
}

const TIPO_BG: Record<TipoVaga, string> = {
  PG:         '#F9FAFB',
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

const TIPO_BADGE_BG: Record<TipoVaga, string> = {
  PG:         '#E5E7EB',
  NOMEACAO:   '#FEE2E2',
  ESCOLHA:    '#DCFCE7',
  DESIGNACAO: '#FEF3C7',
  ACERVO:     '#DBEAFE',
}

const ORDINAL = ['1ª','2ª','3ª','4ª','5ª','6ª','7ª','8ª','9ª','10ª']

// ── card ──────────────────────────────────────────────────────────────────────

function VagaCard({ vaga, procById, onEdit, onClear }: {
  vaga: Vaga
  procById: Record<number, Procurador>
  onEdit: (v: Vaga) => void
  onClear: (v: Vaga) => void
}) {
  const proc = vaga.ocupante_id ? procById[vaga.ocupante_id] : null
  const isAcervo = vaga.tipo === 'ACERVO'
  const isEmpty = !proc

  // Número de preferência satisfeita (só acervo automático)
  let prefInfo = ''
  if (isAcervo && proc) {
    if (vaga.origem === 'MANUAL') {
      prefInfo = 'Substituição manual'
    } else {
      const pref = proc.preferencias.find(p => p.area_codigo === vaga.area_codigo)
      if (pref) {
        prefInfo = `Pref. ${ORDINAL[pref.ordem - 1] ?? `${pref.ordem}ª`}`
      }
    }
  }

  // Nome curto (2 palavras)
  const nomeBreve = proc?.nome.split(' ').slice(0, 3).join(' ')

  return (
    <div
      style={{
        borderColor: TIPO_BORDER[vaga.tipo],
        borderWidth: 2,
        borderStyle: isEmpty && isAcervo ? 'dashed' : 'solid',
        backgroundColor: isEmpty ? '#FAFAFA' : TIPO_BG[vaga.tipo],
      }}
      className="rounded-xl p-3 flex flex-col gap-1.5 min-h-[130px] relative"
    >
      {/* Linha superior: número + badge tipo */}
      <div className="flex items-start justify-between gap-1">
        <span className="text-2xl font-bold leading-none" style={{ color: TIPO_TEXT[vaga.tipo] }}>
          {vaga.numero}
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded leading-tight text-right"
          style={{ backgroundColor: TIPO_BADGE_BG[vaga.tipo], color: TIPO_TEXT[vaga.tipo] }}
        >
          {TIPO_VAGA_LABEL[vaga.tipo].replace(' ', '\n')}
        </span>
      </div>

      {proc ? (
        <>
          {/* Nome */}
          <p className="text-xs font-bold text-gray-800 leading-tight">{nomeBreve}</p>

          {/* Antiguidade */}
          <span
            className="inline-flex items-center self-start px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{ backgroundColor: TIPO_BADGE_BG[vaga.tipo], color: TIPO_TEXT[vaga.tipo] }}
          >
            Nº {proc.antiguidade}
          </span>

          {/* Cargo + info */}
          <p className="text-[10px] text-gray-500 leading-tight mt-auto">
            {vaga.cargo && <>{vaga.cargo} • </>}
            {prefInfo || TIPO_VAGA_LABEL[vaga.tipo]}
          </p>

          {/* Ações (todos os tipos editáveis) */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            <button
              onClick={() => onEdit(vaga)}
              className="p-1 rounded hover:bg-white/60 text-gray-400 hover:text-gray-700"
              title="Editar"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={() => onClear(vaga)}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
              title="Remover ocupante"
            >
              <X size={11} />
            </button>
          </div>
        </>
      ) : (
        /* Vaga vazia */
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <p className="text-[10px] text-gray-300 italic">vaga em aberto</p>
          <button
            onClick={() => onEdit(vaga)}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border"
            style={{
              borderColor: TIPO_BORDER[vaga.tipo],
              color: TIPO_TEXT[vaga.tipo],
              backgroundColor: TIPO_BG[vaga.tipo],
            }}
          >
            <Plus size={10} /> Atribuir
          </button>
        </div>
      )}
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function MapaRelotacao() {
  const { data: ciclo, isLoading: loadingCiclo } = useCicloAtual()
  const { data: areas } = useAreas()
  const { data: vagas, isLoading: loadingVagas } = useVagas(ciclo ? { ciclo_id: ciclo.id } : undefined)
  const { data: procs } = useProcuradores()
  const updateVaga = useUpdateVaga()

  const [editVaga, setEditVaga] = useState<Vaga | null>(null)
  const [selectedProc, setSelectedProc] = useState<string>('')
  const [filterArea, setFilterArea] = useState('')

  // índice procurador completo (com preferencias)
  const procById: Record<number, Procurador> = Object.fromEntries(
    (procs ?? []).map(p => [p.id, p])
  )

  const vagasPorArea: Record<string, Vaga[]> = {}
  for (const v of vagas ?? []) {
    vagasPorArea[v.area_codigo] = [...(vagasPorArea[v.area_codigo] ?? []), v]
  }

  const areasComVagas = (areas ?? []).filter(a =>
    vagasPorArea[a.codigo]?.length &&
    (!filterArea || a.codigo === filterArea)
  )

  async function handleSave() {
    if (!editVaga) return
    await updateVaga.mutateAsync({
      id: editVaga.id,
      data: { ocupante_id: selectedProc ? Number(selectedProc) : null },
    })
    setEditVaga(null)
  }

  async function handleClear(vaga: Vaga) {
    await updateVaga.mutateAsync({ id: vaga.id, data: { ocupante_id: null } })
  }

  function openEdit(vaga: Vaga) {
    setEditVaga(vaga)
    setSelectedProc(String(vaga.ocupante_id ?? ''))
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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Relotação</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ciclo <strong className="text-pge-blue">{ciclo.id}</strong>
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

      {/* Áreas */}
      <div className="space-y-6">
        {areasComVagas.map(area => {
          const vagasArea = (vagasPorArea[area.codigo] ?? [])
            .slice()
            .sort((a, b) => {
              const ord = ['PG','NOMEACAO','ESCOLHA','DESIGNACAO','ACERVO']
              return ord.indexOf(a.tipo) - ord.indexOf(b.tipo) || a.numero - b.numero
            })

          return (
            <div key={area.codigo} className="bg-white border rounded-xl overflow-hidden">
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

              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {vagasArea.map(v => (
                  <VagaCard
                    key={v.id}
                    vaga={v}
                    procById={procById}
                    onEdit={openEdit}
                    onClear={handleClear}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {editVaga && (() => {
        // Verificar se o procurador selecionado já está em outra vaga
        const procIdSel = selectedProc ? Number(selectedProc) : null
        const vagaAtualDoProc = procIdSel
          ? (vagas ?? []).find(v => v.ocupante_id === procIdSel && v.id !== editVaga.id)
          : null
        const areaAtual = vagaAtualDoProc
          ? (areas ?? []).find(a => a.codigo === vagaAtualDoProc.area_codigo)
          : null

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-[420px] mx-4 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold"
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
              <select
                value={selectedProc}
                onChange={e => setSelectedProc(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm mb-3"
              >
                <option value="">— Vaga livre —</option>
                {(procs ?? [])
                  .filter(p => p.ativo)
                  .sort((a, b) => a.antiguidade - b.antiguidade)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      [Nº {p.antiguidade}] {p.nome}
                    </option>
                  ))}
              </select>

              {/* Aviso: procurador já alocado em outra vaga */}
              {vagaAtualDoProc && (
                <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2.5 text-sm">
                  <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                  <div>
                    <p className="text-amber-800 font-medium leading-tight">
                      Este procurador já está alocado
                    </p>
                    <p className="text-amber-700 text-xs mt-0.5">
                      Vaga Nº {vagaAtualDoProc.numero} — {vagaAtualDoProc.area_codigo}
                      {areaAtual ? ` (${areaAtual.nome})` : ''}
                      {vagaAtualDoProc.cargo ? ` · ${vagaAtualDoProc.cargo}` : ''}
                    </p>
                    <p className="text-amber-600 text-xs mt-1 font-medium">
                      Ao salvar, aquela vaga ficará livre.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={() => setEditVaga(null)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleSave}
                  className="px-4 py-2 text-sm text-white rounded"
                  style={{ backgroundColor: vagaAtualDoProc ? '#B45309' : '#005A92' }}>
                  {vagaAtualDoProc ? 'Substituir e salvar' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

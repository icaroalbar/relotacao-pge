import { useState } from 'react'
import { useAreas } from '../api/areas'
import { useVagas, useUpdateVaga } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import { useCicloAtual } from '../api/ciclos'
import Spinner from '../components/Spinner'
import type { Vaga } from '../types'

function VagaRow({ vaga, procs, onSave }: {
  vaga: Vaga
  procs: { id: number; nome: string; antiguidade: number }[]
  onSave: (id: number, ocupante_id: number | null, cargo: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [ocupante, setOcupante] = useState(String(vaga.ocupante_id ?? ''))
  const [cargo, setCargo] = useState(vaga.cargo ?? '')

  function save() { onSave(vaga.id, ocupante ? Number(ocupante) : null, cargo); setEditing(false) }

  const procNome = procs.find(p => p.id === vaga.ocupante_id)?.nome

  return (
    <tr className="border-t">
      <td className="px-4 py-2 text-xs font-mono text-gray-500">#{vaga.numero}</td>
      <td className="px-4 py-2">
        {editing
          ? <input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Cargo/rótulo"
              className="border rounded px-2 py-1 text-sm w-40" />
          : <span className="text-sm text-gray-600">{vaga.cargo || '—'}</span>}
      </td>
      <td className="px-4 py-2">
        {editing
          ? <select value={ocupante} onChange={e => setOcupante(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-56">
              <option value="">— Vaga livre —</option>
              {procs.map(p => <option key={p.id} value={p.id}>[{p.antiguidade}] {p.nome}</option>)}
            </select>
          : <span className="text-sm font-medium">{procNome || <span className="text-gray-300 italic">Vaga livre</span>}</span>}
      </td>
      <td className="px-4 py-2">
        {editing
          ? <div className="flex gap-1">
              <button onClick={save} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Salvar</button>
              <button onClick={() => setEditing(false)} className="text-xs border px-2 py-1 rounded">Cancel</button>
            </div>
          : <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">Editar</button>}
      </td>
    </tr>
  )
}

function SlotPage({ tipo, titulo, cor }: { tipo: string; titulo: string; cor: string }) {
  const { data: ciclo, isLoading } = useCicloAtual()
  const { data: areas } = useAreas()
  const { data: vagas } = useVagas(ciclo ? { ciclo_id: ciclo.id, tipo } : undefined)
  const { data: procs } = useProcuradores()
  const update = useUpdateVaga()

  const [areaFilter, setAreaFilter] = useState('')

  if (isLoading) return <Spinner />
  if (!ciclo) return <p className="p-8 text-amber-600">Nenhum ciclo ativo.</p>

  const filteredVagas = vagas?.filter(v => !areaFilter || v.area_codigo === areaFilter) ?? []
  const vagasPorArea: Record<string, typeof filteredVagas> = {}
  for (const v of filteredVagas) vagasPorArea[v.area_codigo] = [...(vagasPorArea[v.area_codigo] ?? []), v]

  async function handleSave(id: number, ocupante_id: number | null, cargo: string) {
    await update.mutateAsync({ id, data: { ocupante_id, cargo } })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
          <p className="text-sm text-gray-500 mt-1">Ciclo <strong>{ciclo.id}</strong> — vagas <span className={cor}>{tipo.toLowerCase()}</span></p>
        </div>
        <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm">
          <option value="">Todas as áreas</option>
          {areas?.map(a => <option key={a.codigo} value={a.codigo}>{a.codigo} — {a.nome}</option>)}
        </select>
      </div>

      {Object.entries(vagasPorArea).map(([cod, vs]) => {
        const area = areas?.find(a => a.codigo === cod)
        return (
          <div key={cod} className="bg-white border rounded-lg mb-4">
            <div className="px-4 py-2 border-b bg-gray-50">
              <span className="font-mono font-bold text-sm">{cod}</span>
              <span className="text-gray-600 ml-2">{area?.nome}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Vaga</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Cargo</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Procurador</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {vs.map(v => <VagaRow key={v.id} vaga={v} procs={procs ?? []} onSave={handleSave} />)}
              </tbody>
            </table>
          </div>
        )
      })}

      {filteredVagas.length === 0 && (
        <p className="text-gray-400 text-sm">Nenhuma vaga encontrada. Gere as vagas do ciclo primeiro.</p>
      )}
    </div>
  )
}

export default function Nomeacoes() {
  return <SlotPage tipo="NOMEACAO" titulo="Nomeações da Gestão" cor="text-red-600" />
}

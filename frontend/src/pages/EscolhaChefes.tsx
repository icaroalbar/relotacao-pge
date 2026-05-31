import { useAreas } from '../api/areas'
import { useVagas, useUpdateVaga } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import { useCicloAtual } from '../api/ciclos'
import Spinner from '../components/Spinner'
import { useState } from 'react'
import type { Vaga } from '../types'

function VagaRow({ vaga, procs, onSave }: {
  vaga: Vaga
  procs: { id: number; nome: string; antiguidade: number }[]
  onSave: (id: number, ocupante_id: number | null, cargo: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [ocupante, setOcupante] = useState(String(vaga.ocupante_id ?? ''))
  const [cargo, setCargo] = useState(vaga.cargo ?? '')
  const procNome = procs.find(p => p.id === vaga.ocupante_id)?.nome

  function save() { onSave(vaga.id, ocupante ? Number(ocupante) : null, cargo); setEditing(false) }

  return (
    <tr className="border-t">
      <td className="px-4 py-2 text-xs font-mono text-gray-500">#{vaga.numero}</td>
      <td className="px-4 py-2">
        {editing
          ? <input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Cargo"
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
              <button onClick={save} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Salvar</button>
              <button onClick={() => setEditing(false)} className="text-xs border px-2 py-1 rounded">Cancel</button>
            </div>
          : <button onClick={() => setEditing(true)} className="text-xs text-green-600 hover:underline">Editar</button>}
      </td>
    </tr>
  )
}

export default function EscolhaChefes() {
  const { data: ciclo, isLoading } = useCicloAtual()
  const { data: areas } = useAreas()
  const { data: vagas } = useVagas(ciclo ? { ciclo_id: ciclo.id, tipo: 'ESCOLHA' } : undefined)
  const { data: procs } = useProcuradores()
  const update = useUpdateVaga()

  if (isLoading) return <Spinner />
  if (!ciclo) return <p className="p-8 text-amber-600">Nenhum ciclo ativo.</p>

  const vagasPorArea: Record<string, Vaga[]> = {}
  for (const v of vagas ?? []) vagasPorArea[v.area_codigo] = [...(vagasPorArea[v.area_codigo] ?? []), v]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Escolha dos Chefes</h1>
        <p className="text-sm text-gray-500 mt-1">Ciclo <strong>{ciclo.id}</strong> — vagas <span className="text-green-600">escolha (verde)</span></p>
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
                  {['Vaga','Cargo','Procurador',''].map(h => (
                    <th key={h} className="text-left px-4 py-2 font-medium text-gray-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vs.map(v => (
                  <VagaRow key={v.id} vaga={v} procs={procs ?? []}
                    onSave={async (id, ocu, cargo) => { await update.mutateAsync({ id, data: { ocupante_id: ocu, cargo } }) }} />
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
      {(vagas?.length ?? 0) === 0 && <p className="text-gray-400 text-sm">Nenhuma vaga de escolha encontrada.</p>}
    </div>
  )
}

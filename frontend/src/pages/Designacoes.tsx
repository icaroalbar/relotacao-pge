import { useState } from 'react'
import { useVagas, useUpdateVaga } from '../api/vagas'
import { useProcuradores } from '../api/procuradores'
import { useCicloAtual } from '../api/ciclos'
import Spinner from '../components/Spinner'
import type { Vaga } from '../types'

export default function Designacoes() {
  const { data: ciclo, isLoading } = useCicloAtual()
  const { data: vagas } = useVagas(ciclo ? { ciclo_id: ciclo.id, tipo: 'DESIGNACAO' } : undefined)
  const { data: procs } = useProcuradores()
  const update = useUpdateVaga()
  const [editId, setEditId] = useState<number | null>(null)
  const [ocupante, setOcupante] = useState('')
  const [cargo, setCargo] = useState('')

  if (isLoading) return <Spinner />
  if (!ciclo) return <p className="p-8 text-amber-600">Nenhum ciclo ativo.</p>

  function startEdit(v: Vaga) { setEditId(v.id); setOcupante(String(v.ocupante_id ?? '')); setCargo(v.cargo ?? '') }
  async function save() {
    if (!editId) return
    await update.mutateAsync({ id: editId, data: { ocupante_id: ocupante ? Number(ocupante) : null, cargo } })
    setEditId(null)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Designações do PG</h1>
        <p className="text-sm text-gray-500 mt-1">Ciclo <strong>{ciclo.id}</strong> — vagas <span className="text-yellow-600">designação (amarelo)</span> do Gabinete</p>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Área','Vaga','Cargo','Procurador',''].map(h => (
                <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {vagas?.map(v => {
              const procNome = procs?.find(p => p.id === v.ocupante_id)?.nome
              const isEditing = editId === v.id
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs font-semibold">{v.area_codigo}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">#{v.numero}</td>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <input value={cargo} onChange={e => setCargo(e.target.value)} className="border rounded px-2 py-1 text-sm w-40" />
                      : v.cargo || '—'}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <select value={ocupante} onChange={e => setOcupante(e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-56">
                          <option value="">— Vaga livre —</option>
                          {procs?.filter(p => p.ativo).map(p => (
                            <option key={p.id} value={p.id}>[{p.antiguidade}] {p.nome}</option>
                          ))}
                        </select>
                      : <span className="font-medium">{procNome || <span className="text-gray-300 italic">Vaga livre</span>}</span>}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <div className="flex gap-1">
                          <button onClick={save} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">Salvar</button>
                          <button onClick={() => setEditId(null)} className="text-xs border px-2 py-1 rounded">Cancel</button>
                        </div>
                      : <button onClick={() => startEdit(v)} className="text-xs text-yellow-600 hover:underline">Editar</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(vagas?.length ?? 0) === 0 && (
          <p className="px-4 py-8 text-center text-gray-400 text-sm">Nenhuma vaga de designação encontrada.</p>
        )}
      </div>
    </div>
  )
}

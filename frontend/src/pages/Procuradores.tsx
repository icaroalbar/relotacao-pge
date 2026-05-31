import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { useProcuradores, useCreateProcurador, useProcurador } from '../api/procuradores'
import { useAreas } from '../api/areas'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import type { Procurador, ProcuradorCreate, StatusProcurador } from '../types'
import { STATUS_PROC_COLOR } from '../types'

function HistoricoRow({ id }: { id: number }) {
  const { data } = useProcurador(id)
  if (!data?.historico?.length) return <p className="text-xs text-gray-400 px-4 py-2">Sem histórico</p>
  return (
    <div className="px-6 py-3 bg-gray-50 border-t">
      <p className="text-xs font-semibold text-gray-600 mb-2">Histórico de lotações</p>
      <div className="space-y-1">
        {data.historico.map(l => (
          <div key={l.id} className="flex gap-4 text-xs text-gray-600">
            <span className="font-mono w-16">{l.area_codigo}</span>
            <span>{new Date(l.data_entrada).toLocaleDateString('pt-BR')}</span>
            <span>→</span>
            <span>{l.data_saida ? new Date(l.data_saida).toLocaleDateString('pt-BR') : 'atual'}</span>
            <span className="text-gray-400">{l.motivo}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Procuradores() {
  const [filterStatus, setFilterStatus] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<ProcuradorCreate>({ nome: '', antiguidade: 1 })
  const [error, setError] = useState('')

  const { data: procs, isLoading } = useProcuradores(filterStatus ? { status: filterStatus } : undefined)
  const { data: areas } = useAreas()
  const create = useCreateProcurador()

  const areaMap = Object.fromEntries(areas?.map(a => [a.codigo, a.nome]) ?? [])

  async function handleSave() {
    try {
      await create.mutateAsync(form)
      setModal(false)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Erro'
      setError(msg)
    }
  }

  if (isLoading) return <Spinner />

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Procuradores</h1>
        <div className="flex gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-2 text-sm">
            <option value="">Todos os status</option>
            <option value="LOTADO">Lotado</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_LICENCA">Em licença</option>
            <option value="VACANCIA">Vacância</option>
          </select>
          <button onClick={() => { setForm({ nome: '', antiguidade: 1 }); setError(''); setModal(true) }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Antig.', 'Nome', 'Status', 'Lotação atual', ''].map(h => (
                <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {procs?.map(p => (
              <>
                <tr key={p.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500 w-12">{p.antiguidade}</td>
                  <td className="px-4 py-2 font-medium">{p.nome}</td>
                  <td className="px-4 py-2">
                    <Badge className={STATUS_PROC_COLOR[p.status]}>{p.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {p.lotacao_atual_codigo
                      ? <span><span className="font-mono font-semibold">{p.lotacao_atual_codigo}</span> — {areaMap[p.lotacao_atual_codigo]}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-400">
                    {expanded === p.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                </tr>
                {expanded === p.id && (
                  <tr key={`h-${p.id}`}>
                    <td colSpan={5} className="p-0">
                      <HistoricoRow id={p.id} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Novo procurador" onClose={() => setModal(false)}
          footer={
            <>
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
            </>
          }>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Antiguidade</label>
              <input type="number" min={1} value={form.antiguidade}
                onChange={e => setForm(f => ({ ...f, antiguidade: Number(e.target.value) }))}
                className="w-full border rounded px-2 py-1 text-sm" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAreas, useCreateArea, useUpdateArea, useDeleteArea } from '../api/areas'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import type { Area, AreaCreate, TipoArea } from '../types'

const TIPO_COLOR: Record<TipoArea, string> = {
  ESPECIALIZADA: 'bg-purple-100 text-purple-700',
  REGIONAL:      'bg-teal-100 text-teal-700',
  GABINETE:      'bg-orange-100 text-orange-700',
}

const BLANK: AreaCreate = {
  codigo: '', nome: '', tipo: 'ESPECIALIZADA',
  vagas_pg: 0, vagas_nomeacao: 0, vagas_escolha: 0, vagas_designacao: 0, vagas_acervo: 0,
}

export default function Areas() {
  const { data: areas, isLoading } = useAreas()
  const create = useCreateArea()
  const update = useUpdateArea()
  const del = useDeleteArea()

  const [modal, setModal] = useState<'create' | Area | null>(null)
  const [form, setForm] = useState<AreaCreate>(BLANK)
  const [error, setError] = useState('')

  const totalVagas = areas?.reduce((s, a) => s + a.total_vagas, 0) ?? 0

  function openCreate() { setForm(BLANK); setError(''); setModal('create') }
  function openEdit(a: Area) {
    setForm({ codigo: a.codigo, nome: a.nome, tipo: a.tipo,
      vagas_pg: a.vagas_pg, vagas_nomeacao: a.vagas_nomeacao,
      vagas_escolha: a.vagas_escolha, vagas_designacao: a.vagas_designacao, vagas_acervo: a.vagas_acervo })
    setError('')
    setModal(a)
  }

  async function handleSave() {
    try {
      if (modal === 'create') {
        await create.mutateAsync(form)
      } else if (modal) {
        await update.mutateAsync({ codigo: (modal as Area).codigo, data: form })
      }
      setModal(null)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Erro ao salvar'
      setError(msg)
    }
  }

  async function handleDelete(codigo: string) {
    if (!confirm(`Excluir área ${codigo}?`)) return
    await del.mutateAsync(codigo)
  }

  function numInput(field: keyof AreaCreate) {
    return (
      <input
        type="number" min={0}
        value={String(form[field] ?? 0)}
        onChange={e => setForm(f => ({ ...f, [field]: Number(e.target.value) }))}
        className="w-full border rounded px-2 py-1 text-sm"
      />
    )
  }

  if (isLoading) return <Spinner />

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Áreas & Vagas</h1>
          <p className="text-gray-500 text-sm mt-1">Total de vagas: <strong>{totalVagas}</strong></p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Nova área
        </button>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Código','Nome','Tipo','PG','Nom.','Esc.','Des.','Acervo','Total',''].map(h => (
                <th key={h} className="text-left px-3 py-2 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {areas?.map(a => (
              <tr key={a.codigo} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs font-semibold">{a.codigo}</td>
                <td className="px-3 py-2">{a.nome}</td>
                <td className="px-3 py-2">
                  <Badge className={TIPO_COLOR[a.tipo]}>{a.tipo}</Badge>
                </td>
                <td className="px-3 py-2 text-center">{a.vagas_pg || '–'}</td>
                <td className="px-3 py-2 text-center text-red-600">{a.vagas_nomeacao || '–'}</td>
                <td className="px-3 py-2 text-center text-green-600">{a.vagas_escolha || '–'}</td>
                <td className="px-3 py-2 text-center text-yellow-600">{a.vagas_designacao || '–'}</td>
                <td className="px-3 py-2 text-center text-blue-600">{a.vagas_acervo || '–'}</td>
                <td className="px-3 py-2 text-center font-bold">{a.total_vagas}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-blue-600 p-1">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(a.codigo)} className="text-gray-400 hover:text-red-600 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal
          title={modal === 'create' ? 'Nova área' : `Editar ${(modal as Area).codigo}`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Salvar
              </button>
            </>
          }
        >
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Código</label>
              <input value={form.codigo} disabled={modal !== 'create'}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                className="w-full border rounded px-2 py-1 text-sm disabled:bg-gray-100" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoArea }))}
                className="w-full border rounded px-2 py-1 text-sm">
                <option value="ESPECIALIZADA">Especializada</option>
                <option value="REGIONAL">Regional / Posto Avançado</option>
                <option value="GABINETE">Gabinete</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">PG (cinza)</label>{numInput('vagas_pg')}</div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Nomeação (verm.)</label>{numInput('vagas_nomeacao')}</div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Escolha (verde)</label>{numInput('vagas_escolha')}</div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Designação (amar.)</label>{numInput('vagas_designacao')}</div>
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Acervo (azul)</label>{numInput('vagas_acervo')}</div>
          </div>
        </Modal>
      )}
    </div>
  )
}

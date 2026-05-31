import { Fragment, useRef, useState } from 'react'
import { Plus, Eye, Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react'
import { useProcuradores, useCreateProcurador, useProcurador } from '../api/procuradores'
import { useAreas } from '../api/areas'
import { useVagas } from '../api/vagas'
import { useCicloAtual } from '../api/ciclos'
import { useQueryClient } from '@tanstack/react-query'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import client from '../api/client'
import type { Procurador, ProcuradorCreate, StatusProcurador } from '../types'
import { STATUS_PROC_COLOR } from '../types'

function HistoricoRow({ id }: { id: number }) {
  const { data } = useProcurador(id)
  if (!data?.historico?.length) return (
    <p className="text-xs text-gray-400 px-6 py-3">Sem histórico registrado.</p>
  )
  return (
    <div className="px-6 py-3 bg-gray-50 border-t">
      <p className="text-xs font-semibold text-gray-600 mb-2">Histórico de lotações</p>
      <div className="space-y-1">
        {data.historico.map(l => (
          <div key={l.id} className="flex gap-4 text-xs text-gray-600">
            <span className="font-mono font-bold w-20 text-pge-blue">{l.area_codigo}</span>
            <span>{new Date(l.data_entrada).toLocaleDateString('pt-BR')}</span>
            <span className="text-gray-300">→</span>
            <span>{l.data_saida ? new Date(l.data_saida).toLocaleDateString('pt-BR') : 'atual'}</span>
            <span className="text-gray-400">{l.motivo.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function situacaoAtual(
  proc: Procurador,
  vagaMap: Record<number, { area_codigo: string; tipo: string }>,
  areaMap: Record<string, string>
): string {
  if (!proc.ativo) return proc.status === 'EM_LICENCA' ? 'Em licença' : 'Vacância'
  const vaga = vagaMap[proc.id]
  if (!vaga) return 'Sem vaga no ciclo'
  const area = areaMap[vaga.area_codigo] || vaga.area_codigo
  if (proc.lotacao_atual_codigo === vaga.area_codigo) return 'Permanência por preferência'
  return `Movimentação → ${vaga.area_codigo}`
}

// ── Modal de Importação ───────────────────────────────────────────────────────

function ModalImportacao({ cicloId, onClose }: { cicloId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [erro, setErro] = useState('')

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setErro('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('arquivo', file)
      const res = await client.post(`/importacao/planilha?ciclo_id=${cicloId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
      qc.invalidateQueries({ queryKey: ['procuradores'] })
      qc.invalidateQueries({ queryKey: ['vagas'] })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErro(msg ?? 'Erro ao importar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Importar planilha de procuradores" onClose={onClose}
      footer={
        result ? (
          <button onClick={onClose} className="px-4 py-2 text-sm bg-[#005A92] text-white rounded">Fechar</button>
        ) : (
          <>
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
            <button onClick={handleUpload} disabled={!file || loading}
              className="px-4 py-2 text-sm bg-[#005A92] text-white rounded disabled:opacity-40">
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </>
        )
      }
    >
      {/* Formato */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs">
        <p className="font-semibold text-blue-800 mb-1 flex items-center gap-1">
          <FileSpreadsheet size={13} /> Formato aceito (.xlsx)
        </p>
        <p className="text-blue-700 mb-2">
          Planilha com as colunas abaixo. Colunas com códigos de área (ex: PG-03) são tratadas como preferências — o valor é a ordem (1 = mais querida).
        </p>
        <div className="font-mono bg-white border rounded px-2 py-1 text-[10px] text-gray-600 overflow-x-auto whitespace-nowrap">
          Antiguidade | Nome | LotacaoAtual | Status | PG-03 | PG-04 | 1PR-NIT | ...
        </div>
        <p className="text-blue-600 mt-2 text-[10px]">
          Status: LOTADO · PENDENTE · EM_LICENCA · VACANCIA (padrão: PENDENTE)
        </p>
      </div>

      {/* Upload */}
      {!result && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-[#005A92] hover:bg-blue-50 transition-colors"
        >
          <Upload size={24} className="mx-auto text-gray-400 mb-2" />
          {file ? (
            <p className="text-sm font-medium text-[#005A92]">{file.name}</p>
          ) : (
            <p className="text-sm text-gray-500">Clique para selecionar o arquivo .xlsx</p>
          )}
          <input
            ref={fileRef} type="file" accept=".xlsx" className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-green-800 flex items-center gap-2 mb-2">
            <CheckCircle size={15} /> Importação concluída
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700">
            {Object.entries(result).filter(([k]) => k !== 'erros').map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k.replace(/_/g, ' ')}</span>
                <span className="font-semibold">{String(v)}</span>
              </div>
            ))}
          </div>
          {Array.isArray(result.erros) && result.erros.length > 0 && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 rounded p-2">
              <p className="font-semibold flex items-center gap-1 mb-1">
                <AlertTriangle size={12} /> Avisos
              </p>
              {(result.erros as string[]).map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>
      )}

      {erro && <p className="text-red-600 text-sm mt-3">{erro}</p>}
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Procuradores() {
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [modal, setModal] = useState(false)
  const [modalImport, setModalImport] = useState(false)
  const [form, setForm] = useState<ProcuradorCreate>({ nome: '', antiguidade: 1 })
  const [error, setError] = useState('')

  const { data: ciclo } = useCicloAtual()
  const { data: procs, isLoading } = useProcuradores(filterStatus ? { status: filterStatus } : undefined)
  const { data: areas } = useAreas()
  const { data: vagas } = useVagas(ciclo ? { ciclo_id: ciclo.id } : undefined)
  const create = useCreateProcurador()

  const areaMap = Object.fromEntries(areas?.map(a => [a.codigo, a.nome]) ?? [])
  // Mapa ocupante_id → vaga (para mostrar nova lotação)
  const vagaMap: Record<number, { area_codigo: string; tipo: string }> = {}
  for (const v of vagas ?? []) {
    if (v.ocupante_id) vagaMap[v.ocupante_id] = { area_codigo: v.area_codigo, tipo: v.tipo }
  }

  const filtered = (procs ?? []).filter(p =>
    !search || p.nome.toLowerCase().includes(search.toLowerCase()) ||
    String(p.antiguidade).includes(search)
  )

  async function handleSave() {
    try {
      await create.mutateAsync(form)
      setModal(false)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Erro')
    }
  }

  if (isLoading) return <Spinner />

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Procuradores</h1>
        <div className="flex gap-3 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou antiguidade…"
            className="border rounded px-3 py-2 text-sm w-56" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-2 text-sm">
            <option value="">Todos os status</option>
            <option value="LOTADO">Lotado</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_LICENCA">Em licença</option>
            <option value="VACANCIA">Vacância</option>
          </select>
          <button onClick={() => setModalImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: '#005A92', color: '#005A92' }}>
            <Upload size={15} /> Importar planilha
          </button>
          <button onClick={() => { setForm({ nome: '', antiguidade: 1 }); setError(''); setModal(true) }}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: '#005A92' }}>
            <Plus size={15} /> Novo
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#EEF4FB' }} className="border-b">
            <tr>
              {['Antiguidade', 'Nome', 'Status', 'Lotação Original', 'Situação Atual', 'Nova Lotação', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-semibold text-xs text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const nova = vagaMap[p.id]
              const sit = ciclo ? situacaoAtual(p, vagaMap, areaMap) : '—'
              const isExpanded = expanded === p.id
              return (
                <Fragment key={p.id}>
                  <tr className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: '#005A92' }}>
                        {p.antiguidade}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-800">{p.nome}</p>
                      {p.lotacao_atual_codigo && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Atualmente em {areaMap[p.lotacao_atual_codigo] || p.lotacao_atual_codigo}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className={STATUS_PROC_COLOR[p.status as StatusProcurador]}>
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {p.lotacao_atual_codigo ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: '#EEF4FB', color: '#005A92' }}>
                          {p.lotacao_atual_codigo}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{sit}</td>
                    <td className="px-4 py-2.5">
                      {nova ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: '#F0FDF4', color: '#427942' }}>
                          {nova.area_codigo}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => setExpanded(isExpanded ? null : p.id)}
                        className="text-gray-400 hover:text-pge-blue p-1 rounded">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <HistoricoRow id={p.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-400 text-sm">Nenhum procurador encontrado.</p>
        )}
      </div>

      {modal && (
        <Modal title="Novo procurador" onClose={() => setModal(false)}
          footer={
            <>
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm text-white rounded"
                style={{ backgroundColor: '#005A92' }}>Salvar</button>
            </>
          }>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Antiguidade</label>
              <input type="number" min={1} value={form.antiguidade}
                onChange={e => setForm(f => ({ ...f, antiguidade: Number(e.target.value) }))}
                className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
        </Modal>
      )}

      {modalImport && ciclo && (
        <ModalImportacao cicloId={ciclo.id} onClose={() => setModalImport(false)} />
      )}
      {modalImport && !ciclo && (
        <Modal title="Importar planilha" onClose={() => setModalImport(false)}
          footer={<button onClick={() => setModalImport(false)} className="px-4 py-2 text-sm border rounded">Fechar</button>}>
          <p className="text-amber-600 text-sm">Crie um ciclo primeiro em <strong>Encerrar Ciclo</strong> antes de importar.</p>
        </Modal>
      )}
    </div>
  )
}

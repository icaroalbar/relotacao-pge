import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useCiclos } from '../api/ciclos'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import type { Ciclo } from '../types'

const STATUS_COLOR: Record<string, string> = {
  EM_CURSO:  'bg-green-100 text-green-700',
  ENCERRADO: 'bg-gray-100 text-gray-700',
  CANCELADO: 'bg-red-100 text-red-700',
}

function CicloDetalhe({ ciclo }: { ciclo: Ciclo }) {
  if (ciclo.status !== 'ENCERRADO') return null
  return (
    <div className="bg-gray-50 border-t px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
      <div>
        <p className="text-xs text-gray-500">Procuradores</p>
        <p className="font-bold">{ciclo.total_procuradores ?? '—'}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Vagas</p>
        <p className="font-bold">{ciclo.total_vagas ?? '—'}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Movimentações</p>
        <p className="font-bold">{ciclo.movimentacoes ?? '—'}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Permanências</p>
        <p className="font-bold">{ciclo.permanencias ?? '—'}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">% 1ª Preferência</p>
        <p className="font-bold">{ciclo.pct_primeira_pref != null ? `${ciclo.pct_primeira_pref.toFixed(1)}%` : '—'}</p>
      </div>
    </div>
  )
}

export default function HistoricoCiclos() {
  const { data: ciclos, isLoading } = useCiclos()
  const [expanded, setExpanded] = useState<string | null>(null)

  if (isLoading) return <Spinner />

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Ciclos</h1>

      <div className="bg-white border rounded-lg overflow-hidden">
        {ciclos?.map(c => (
          <div key={c.id} className="border-b last:border-0">
            <div
              className="flex items-center px-5 py-4 cursor-pointer hover:bg-gray-50 gap-4"
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            >
              <span className="font-mono font-bold text-sm w-20">{c.id}</span>
              <Badge className={STATUS_COLOR[c.status]}>{c.status.replace('_', ' ')}</Badge>
              <span className="text-sm text-gray-500">
                {new Date(c.abertura).toLocaleDateString('pt-BR')}
                {c.encerramento && ` → ${new Date(c.encerramento).toLocaleDateString('pt-BR')}`}
              </span>
              {c.status === 'ENCERRADO' && (
                <span className="text-xs text-gray-400 ml-auto">
                  {c.movimentacoes} movimentações · {c.pct_primeira_pref?.toFixed(1)}% 1ª pref.
                </span>
              )}
              <span className="text-gray-400 ml-2">
                {expanded === c.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </div>
            {expanded === c.id && <CicloDetalhe ciclo={c} />}
          </div>
        ))}
        {!ciclos?.length && (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">Nenhum ciclo registrado.</p>
        )}
      </div>
    </div>
  )
}

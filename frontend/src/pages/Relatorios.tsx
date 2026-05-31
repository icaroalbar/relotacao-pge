import { Download } from 'lucide-react'
import { useCiclos } from '../api/ciclos'
import Spinner from '../components/Spinner'

function RelBtn({ label, href, disabled }: { label: string; href: string; disabled?: boolean }) {
  return (
    <a
      href={disabled ? '#' : href}
      onClick={e => disabled && e.preventDefault()}
      className={`flex items-center gap-2 border rounded-lg px-4 py-3 text-sm transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-[#005A92] text-[#005A92]'}`}
    >
      <Download size={15} />
      {label}
    </a>
  )
}

export default function Relatorios() {
  const { data: ciclos, isLoading } = useCiclos()

  if (isLoading) return <Spinner />

  const encerrados = ciclos?.filter(c => c.status === 'ENCERRADO') ?? []

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Relatórios</h1>

      <div className="bg-white border rounded-lg p-5 mb-6">
        <h2 className="font-semibold mb-3 text-gray-700">Exportar por ciclo</h2>
        {encerrados.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum ciclo encerrado disponível.</p>
        ) : (
          <div className="space-y-4">
            {encerrados.map(c => (
              <div key={c.id} className="border rounded-lg p-4">
                <p className="font-mono font-bold text-sm mb-3">{c.id}</p>
                <div className="grid grid-cols-2 gap-2">
                  <RelBtn label="Mapa de relotação (PDF)" href={`/api/relatorios/${c.id}/mapa.pdf`} />
                  <RelBtn label="Mapa de relotação (Excel)" href={`/api/relatorios/${c.id}/mapa.xlsx`} />
                  <RelBtn label="Lista de lotações (Excel)" href={`/api/relatorios/${c.id}/lotacoes.xlsx`} />
                  <RelBtn label="Ato administrativo (PDF)" href={`/api/relatorios/${c.id}/ato.pdf`} />
                </div>
                <p className="text-xs font-semibold text-gray-500 mt-4 mb-2">Relatórios de encerramento</p>
                <div className="grid grid-cols-2 gap-2">
                  <RelBtn label="Movimentações (Excel)" href={`/api/relatorios/${c.id}/movimentacoes.xlsx`} />
                  <RelBtn label="Decisões manuais (Excel)" href={`/api/relatorios/${c.id}/decisoes-manuais.xlsx`} />
                  <RelBtn label="Estatísticas (Excel)" href={`/api/relatorios/${c.id}/estatisticas.xlsx`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-3 text-gray-700">Exportar dados gerais</h2>
        <div className="grid grid-cols-2 gap-2">
          <RelBtn label="Lista de procuradores (Excel)" href="/api/relatorios/procuradores.xlsx" />
          <RelBtn label="Estrutura de áreas (Excel)" href="/api/relatorios/areas.xlsx" />
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Exportações de dados gerais disponíveis na Fase 5 do desenvolvimento.
        </p>
      </div>
    </div>
  )
}

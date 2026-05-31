export type TipoArea = 'ESPECIALIZADA' | 'REGIONAL' | 'GABINETE'
export type TipoVaga = 'PG' | 'NOMEACAO' | 'ESCOLHA' | 'DESIGNACAO' | 'ACERVO'
export type StatusProcurador = 'LOTADO' | 'PENDENTE' | 'EM_LICENCA' | 'VACANCIA'
export type StatusCiclo = 'EM_CURSO' | 'ENCERRADO' | 'CANCELADO'
export type MotivoLotacao =
  | 'POSSE_INICIAL'
  | 'NOMEACAO'
  | 'ESCOLHA_CHEFE'
  | 'DESIGNACAO_PG'
  | 'ACERVO'
  | 'PERMANENCIA'
  | 'SUBSTITUICAO_MANUAL'

export interface Area {
  codigo: string
  nome: string
  tipo: TipoArea
  vagas_pg: number
  vagas_nomeacao: number
  vagas_escolha: number
  vagas_designacao: number
  vagas_acervo: number
  rotulos_nomeacao: string[] | null
  rotulos_designacao: string[] | null
  total_vagas: number
}

export interface Preferencia {
  area_codigo: string
  ordem: number
}

export interface Procurador {
  id: number
  nome: string
  antiguidade: number
  status: StatusProcurador
  lotacao_atual_codigo: string | null
  ativo: boolean
  preferencias: Preferencia[]
}

export interface ProcuradorDetalhe extends Procurador {
  historico: Lotacao[]
}

export interface Vaga {
  id: number
  area_codigo: string
  numero: number
  tipo: TipoVaga
  cargo: string | null
  ocupante_id: number | null
  origem: 'AUTOMATICA' | 'MANUAL'
  ciclo_id: string | null
}

export interface Ciclo {
  id: string
  abertura: string
  encerramento: string | null
  status: StatusCiclo
  snapshot: Vaga[] | null
  total_procuradores: number | null
  total_vagas: number | null
  movimentacoes: number | null
  permanencias: number | null
  pct_primeira_pref: number | null
}

export interface Lotacao {
  id: number
  procurador_id: number
  area_codigo: string
  data_entrada: string
  data_saida: string | null
  motivo: MotivoLotacao
  ciclo_id: string
}

// ── Criação / atualização ──────────────────────────────────────────────────────

export interface AreaCreate {
  codigo: string
  nome: string
  tipo: TipoArea
  vagas_pg?: number
  vagas_nomeacao?: number
  vagas_escolha?: number
  vagas_designacao?: number
  vagas_acervo?: number
}

export interface AreaUpdate {
  nome?: string
  vagas_pg?: number
  vagas_nomeacao?: number
  vagas_escolha?: number
  vagas_designacao?: number
  vagas_acervo?: number
}

export interface ProcuradorCreate {
  nome: string
  antiguidade: number
  status?: StatusProcurador
  lotacao_atual_codigo?: string | null
}

export interface VagaUpdate {
  cargo?: string | null
  ocupante_id?: number | null
  origem?: string
}

// ── UI helpers ────────────────────────────────────────────────────────────────

export const TIPO_VAGA_LABEL: Record<TipoVaga, string> = {
  PG: 'PG',
  NOMEACAO: 'Nomeação',
  ESCOLHA: 'Escolha do Chefe',
  DESIGNACAO: 'Designação PG',
  ACERVO: 'Acervo',
}

export const TIPO_VAGA_COLOR: Record<TipoVaga, string> = {
  PG:         'bg-gray-200 text-gray-800',
  NOMEACAO:   'bg-red-100 text-red-800',
  ESCOLHA:    'bg-green-100 text-green-800',
  DESIGNACAO: 'bg-yellow-100 text-yellow-800',
  ACERVO:     'bg-blue-100 text-blue-800',
}

export const TIPO_VAGA_DOT: Record<TipoVaga, string> = {
  PG:         'bg-gray-400',
  NOMEACAO:   'bg-red-500',
  ESCOLHA:    'bg-green-500',
  DESIGNACAO: 'bg-yellow-500',
  ACERVO:     'bg-blue-500',
}

export const STATUS_PROC_COLOR: Record<StatusProcurador, string> = {
  LOTADO:     'bg-green-100 text-green-800',
  PENDENTE:   'bg-yellow-100 text-yellow-800',
  EM_LICENCA: 'bg-orange-100 text-orange-800',
  VACANCIA:   'bg-gray-100 text-gray-500',
}

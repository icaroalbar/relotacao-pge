import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Ciclo } from '../types'

export const useCiclos = () =>
  useQuery<Ciclo[]>({ queryKey: ['ciclos'], queryFn: () => client.get('/ciclos').then(r => r.data) })

export const useCicloAtual = () =>
  useQuery<Ciclo | null>({
    queryKey: ['ciclos', 'atual'],
    queryFn: async () => {
      const ciclos: Ciclo[] = await client.get('/ciclos').then(r => r.data)
      return ciclos.find(c => c.status === 'EM_CURSO') ?? null
    },
  })

export const useCreateCiclo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; abertura: string }) => client.post('/ciclos', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ciclos'] }),
  })
}

export const useAlocarAcervo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ciclo_id: string) => client.post(`/ciclos/${ciclo_id}/alocar-acervo`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vagas'] })
      qc.invalidateQueries({ queryKey: ['procuradores'] })
    },
  })
}

export const useEncerrarCiclo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ciclo_id: string) => client.post(`/ciclos/${ciclo_id}/encerrar`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ciclos'] }),
  })
}

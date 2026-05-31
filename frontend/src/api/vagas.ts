import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Vaga, VagaUpdate } from '../types'

export const useVagas = (params?: { area_codigo?: string; tipo?: string; ciclo_id?: string }) =>
  useQuery<Vaga[]>({
    queryKey: ['vagas', params],
    queryFn: () => client.get('/vagas', { params }).then(r => r.data),
    enabled: !!(params?.ciclo_id || params?.area_codigo),
  })

export const useUpdateVaga = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VagaUpdate }) =>
      client.patch(`/vagas/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vagas'] })
      qc.invalidateQueries({ queryKey: ['procuradores'] })
    },
  })
}

export const useGerarVagas = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ciclo_id: string) => client.post(`/vagas/gerar/${ciclo_id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vagas'] }),
  })
}

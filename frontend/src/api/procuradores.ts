import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Procurador, ProcuradorCreate, ProcuradorDetalhe, Preferencia } from '../types'

export const useProcuradores = (params?: { status?: string; area_codigo?: string }) =>
  useQuery<Procurador[]>({
    queryKey: ['procuradores', params],
    queryFn: () => client.get('/procuradores', { params }).then(r => r.data),
  })

export const useProcurador = (id: number) =>
  useQuery<ProcuradorDetalhe>({
    queryKey: ['procuradores', id],
    queryFn: () => client.get(`/procuradores/${id}`).then(r => r.data),
  })

export const useCreateProcurador = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProcuradorCreate) => client.post('/procuradores', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procuradores'] }),
  })
}

export const useUpdateProcurador = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProcuradorCreate> }) =>
      client.patch(`/procuradores/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procuradores'] }),
  })
}

export const useSetPreferencias = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, prefs }: { id: number; prefs: Omit<Preferencia, never>[] }) =>
      client.put(`/procuradores/${id}/preferencias`, prefs.map(p => ({ procurador_id: id, ...p }))).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procuradores'] }),
  })
}

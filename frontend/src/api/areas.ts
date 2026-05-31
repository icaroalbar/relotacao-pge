import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Area, AreaCreate, AreaUpdate } from '../types'

export const useAreas = () =>
  useQuery<Area[]>({ queryKey: ['areas'], queryFn: () => client.get('/areas').then(r => r.data) })

export const useArea = (codigo: string) =>
  useQuery<Area>({ queryKey: ['areas', codigo], queryFn: () => client.get(`/areas/${codigo}`).then(r => r.data) })

export const useCreateArea = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AreaCreate) => client.post('/areas', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['areas'] }),
  })
}

export const useUpdateArea = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ codigo, data }: { codigo: string; data: AreaUpdate }) =>
      client.patch(`/areas/${codigo}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['areas'] }),
  })
}

export const useDeleteArea = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (codigo: string) => client.delete(`/areas/${codigo}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['areas'] }),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteFavorite, fetchFavorites, postFavorite } from '@/api/favorites'
import { useAuthStore } from '@/store/authStore'

const FAVORITES_KEY = ['favorites']

export function useFavorites() {
  const session = useAuthStore((s) => s.session)
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: () => fetchFavorites(session!.access_token),
    enabled: !!session,
  })
}

export function useAddFavorite() {
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fipeCode, vehicleLabel }: { fipeCode: string; vehicleLabel: string }) =>
      postFavorite(session!.access_token, fipeCode, vehicleLabel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  })
}

export function useRemoveFavorite() {
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fipeCode: string) => deleteFavorite(session!.access_token, fipeCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  })
}

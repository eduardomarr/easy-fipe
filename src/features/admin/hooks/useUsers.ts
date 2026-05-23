import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteUser, fetchUser, fetchUsers } from '@/api/users'
import { useAuthStore } from '@/store/authStore'

const USERS_KEY = ['users']

export function useUsers() {
  const session = useAuthStore((s) => s.session)
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => fetchUsers(session!.access_token),
    enabled: !!session,
  })
}

export function useUser(id: string | null) {
  const session = useAuthStore((s) => s.session)
  return useQuery({
    queryKey: [...USERS_KEY, id],
    queryFn: () => fetchUser(session!.access_token, id!),
    enabled: !!session && !!id,
  })
}

export function useDeleteUser() {
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(session!.access_token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}

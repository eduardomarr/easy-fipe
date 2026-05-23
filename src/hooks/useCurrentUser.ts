import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

export interface CurrentUser {
  id: string
  email: string
  fullName: string | null
  role: 'admin' | 'standard'
  notificationEmailOptIn: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

const CURRENT_USER_KEY = ['currentUser']

async function fetchCurrentUser(token: string): Promise<CurrentUser> {
  const res = await fetch('/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Me API error ${res.status}`)
  return res.json() as Promise<CurrentUser>
}

export function useCurrentUser() {
  const session = useAuthStore((s) => s.session)
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: () => fetchCurrentUser(session!.access_token),
    enabled: !!session,
  })
}

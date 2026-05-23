import type { CurrentUser } from '@/hooks/useCurrentUser'

export type AdminUser = CurrentUser

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/users${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`Users API error ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function fetchUsers(token: string): Promise<AdminUser[]> {
  return apiFetch('', token)
}

export function fetchUser(token: string, id: string): Promise<AdminUser> {
  return apiFetch(`/${encodeURIComponent(id)}`, token)
}

export function deleteUser(token: string, id: string): Promise<void> {
  return apiFetch(`/${encodeURIComponent(id)}`, token, { method: 'DELETE' })
}

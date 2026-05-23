export interface Favorite {
  id: string
  userId: string
  fipeCode: string
  vehicleLabel: string
  createdAt: string
}

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/favorites${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`Favorites API error ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function fetchFavorites(token: string): Promise<Favorite[]> {
  return apiFetch('', token)
}

export function postFavorite(
  token: string,
  fipeCode: string,
  vehicleLabel: string,
): Promise<Favorite> {
  return apiFetch('', token, {
    method: 'POST',
    body: JSON.stringify({ fipeCode, vehicleLabel }),
  })
}

export function deleteFavorite(token: string, fipeCode: string): Promise<void> {
  return apiFetch(`/${encodeURIComponent(fipeCode)}`, token, { method: 'DELETE' })
}

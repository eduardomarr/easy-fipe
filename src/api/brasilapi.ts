import type { BrasilApiPrice, BrasilApiReference } from '@/types/fipe'
import { track } from '@/lib/analytics'

const BASE_URL = 'https://brasilapi.com.br/api/fipe'

export async function fetchReferenceTables(): Promise<BrasilApiReference[]> {
  const res = await fetch(`${BASE_URL}/tabelas/v1`)
  if (!res.ok) {
    track('api_error', { path: '/tabelas/v1', status: String(res.status), status_text: res.statusText })
    throw new Error(`BrasilAPI error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<BrasilApiReference[]>
}

export async function fetchHistoricalPrice(
  fipeCode: string,
  referenceCode: number,
): Promise<BrasilApiPrice[]> {
  const path = `/preco/v1/${fipeCode}?tabela_referencia=${referenceCode}`
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    track('api_error', { path, status: String(res.status), status_text: res.statusText })
    throw new Error(`BrasilAPI error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<BrasilApiPrice[]>
}

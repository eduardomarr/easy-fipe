import type { BrasilApiPrice, BrasilApiReference } from '@/types/fipe'

const BASE_URL = 'https://brasilapi.com.br/api/fipe'

export async function fetchReferenceTables(): Promise<BrasilApiReference[]> {
  const res = await fetch(`${BASE_URL}/tabelas/v1`)
  if (!res.ok) {
    throw new Error(`BrasilAPI error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<BrasilApiReference[]>
}

export async function fetchHistoricalPrice(
  fipeCode: string,
  referenceCode: number,
): Promise<BrasilApiPrice[]> {
  const res = await fetch(
    `${BASE_URL}/preco/v1/${fipeCode}?tabela_referencia=${referenceCode}`,
  )
  if (!res.ok) {
    throw new Error(`BrasilAPI error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<BrasilApiPrice[]>
}

const BRASILAPI_FIPE = 'https://brasilapi.com.br/api/fipe/preco/v1'

export interface FipeCurrentPrice {
  priceBrl: number
  referenceMonth: string
}

export async function fetchCurrentPrice(fipeCode: string): Promise<FipeCurrentPrice> {
  const res = await fetch(`${BRASILAPI_FIPE}/${encodeURIComponent(fipeCode)}`)
  if (!res.ok) throw new Error(`BrasilAPI FIPE error ${res.status} for ${fipeCode}`)
  const data = (await res.json()) as Array<{ valor: string; referencia: string }>
  const latest = data[0]
  if (!latest) throw new Error(`No price data returned for ${fipeCode}`)
  return {
    priceBrl: parsePriceToCentavos(latest.valor),
    referenceMonth: latest.referencia,
  }
}

function parsePriceToCentavos(valor: string): number {
  // "R$ 35.000,00" → 3500000
  const digits = valor.replace(/[R$\s.]/g, '').replace(',', '.')
  return Math.round(parseFloat(digits) * 100)
}

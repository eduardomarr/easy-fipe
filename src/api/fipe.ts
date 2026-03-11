import type { FipeOption, FipePrice, VehicleType } from '@/types/fipe'

const BASE_URL = 'https://fipe.parallelum.com.br/api/v2'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`FIPE API error ${res.status}: ${res.statusText} (${path})`)
  }
  return res.json() as Promise<T>
}

export function fetchBrands(vehicleType: VehicleType): Promise<FipeOption[]> {
  return apiFetch<FipeOption[]>(`/${vehicleType}/brands`)
}

export function fetchModels(vehicleType: VehicleType, brandCode: string): Promise<FipeOption[]> {
  return apiFetch<FipeOption[]>(`/${vehicleType}/brands/${brandCode}/models`)
}

export function fetchYears(
  vehicleType: VehicleType,
  brandCode: string,
  modelCode: string,
): Promise<FipeOption[]> {
  return apiFetch<FipeOption[]>(`/${vehicleType}/brands/${brandCode}/models/${modelCode}/years`)
}

export function fetchPrice(
  vehicleType: VehicleType,
  brandCode: string,
  modelCode: string,
  yearCode: string,
): Promise<FipePrice> {
  return apiFetch<FipePrice>(
    `/${vehicleType}/brands/${brandCode}/models/${modelCode}/years/${yearCode}`,
  )
}


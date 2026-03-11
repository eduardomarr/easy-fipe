import { useQuery } from '@tanstack/react-query'
import { fetchBrands } from '@/api/fipe'
import type { VehicleType } from '@/types/fipe'

export const fipeKeys = {
  brands: (vehicleType: VehicleType) => ['fipe', 'brands', vehicleType] as const,
  models: (vehicleType: VehicleType, brandCode: string) =>
    ['fipe', 'models', vehicleType, brandCode] as const,
  years: (vehicleType: VehicleType, brandCode: string, modelCode: string) =>
    ['fipe', 'years', vehicleType, brandCode, modelCode] as const,
  price: (vehicleType: VehicleType, brandCode: string, modelCode: string, yearCode: string) =>
    ['fipe', 'price', vehicleType, brandCode, modelCode, yearCode] as const,
  referenceTables: () => ['brasilapi', 'referenceTables'] as const,
  historicalPrice: (fipeCode: string, referenceCode: number) =>
    ['brasilapi', 'historicalPrice', fipeCode, referenceCode] as const,
}

export function useBrands(vehicleType: VehicleType) {
  return useQuery({
    queryKey: fipeKeys.brands(vehicleType),
    queryFn: () => fetchBrands(vehicleType),
  })
}

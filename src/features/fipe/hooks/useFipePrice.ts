import { useQuery } from '@tanstack/react-query'
import { fetchPrice } from '@/api/fipe'
import type { VehicleType } from '@/types/fipe'
import { fipeKeys } from './useBrands'

export function useFipePrice(
  vehicleType: VehicleType,
  brandCode: string | null,
  modelCode: string | null,
  yearCode: string | null,
) {
  return useQuery({
    queryKey: fipeKeys.price(vehicleType, brandCode ?? '', modelCode ?? '', yearCode ?? ''),
    queryFn: () => fetchPrice(vehicleType, brandCode!, modelCode!, yearCode!),
    enabled: !!brandCode && !!modelCode && !!yearCode,
  })
}

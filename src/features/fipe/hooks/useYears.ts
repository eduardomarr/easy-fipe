import { useQuery } from '@tanstack/react-query'
import { fetchYears } from '@/api/fipe'
import type { VehicleType } from '@/types/fipe'
import { fipeKeys } from './useBrands'

export function useYears(
  vehicleType: VehicleType,
  brandCode: string | null,
  modelCode: string | null,
) {
  return useQuery({
    queryKey: fipeKeys.years(vehicleType, brandCode ?? '', modelCode ?? ''),
    queryFn: () => fetchYears(vehicleType, brandCode!, modelCode!),
    enabled: !!brandCode && !!modelCode,
  })
}

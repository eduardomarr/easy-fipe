import { useQuery } from '@tanstack/react-query'
import { fetchModels } from '@/api/fipe'
import type { VehicleType } from '@/types/fipe'
import { fipeKeys } from './useBrands'

export function useModels(vehicleType: VehicleType, brandCode: string | null) {
  return useQuery({
    queryKey: fipeKeys.models(vehicleType, brandCode ?? ''),
    queryFn: () => fetchModels(vehicleType, brandCode!),
    enabled: !!brandCode,
  })
}

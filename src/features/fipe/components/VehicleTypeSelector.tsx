import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { track } from '@/lib/analytics'
import type { VehicleType } from '@/types/fipe'

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'cars', label: 'Carro' },
  { value: 'motorcycles', label: 'Moto' },
  { value: 'trucks', label: 'Caminhão' },
]

interface Props {
  value: VehicleType
  onChange: (type: VehicleType) => void
}

export function VehicleTypeSelector({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => { track('vehicle_type_selected', { vehicle_type: v }); onChange(v as VehicleType) }}>
      <TabsList className="w-full">
        {VEHICLE_TYPES.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="flex-1">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

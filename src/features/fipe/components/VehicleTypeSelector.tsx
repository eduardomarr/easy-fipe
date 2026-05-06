import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { VehicleType } from '@/types/fipe'

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'cars', label: 'Carro' },
  { value: 'motorcycles', label: 'Moto' },
  { value: 'trucks', label: 'Caminhao' },
]

interface Props {
  value: VehicleType
  onChange: (type: VehicleType) => void
}

export function VehicleTypeSelector({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as VehicleType)}>
      <TabsList className="w-full bg-card border border-border/50">
        {VEHICLE_TYPES.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="flex-1 text-xs uppercase tracking-wider font-medium">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

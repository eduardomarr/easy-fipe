import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { FipePrice } from '@/types/fipe'

interface Props {
  data: FipePrice
}

const DETAIL_ROWS = [
  { label: 'Marca', key: 'brand' },
  { label: 'Modelo', key: 'model' },
  { label: 'Ano modelo', key: 'modelYear' },
  { label: 'Combustível', key: 'fuel' },
  { label: 'Código FIPE', key: 'fipeCode' },
  { label: 'Mês referência', key: 'referenceMonth' },
] as const

export function FipeResult({ data }: Props) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg shadow-primary/10">
      <div className="bg-red-600 px-6 py-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-red-200 uppercase tracking-wider">
              {data.referenceMonth}
            </p>
            <p className="text-lg font-bold text-white leading-tight mt-0.5 truncate">
              {data.brand} {data.model}
            </p>
          </div>
          <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 shrink-0">
            {data.fuelAcronym}
          </Badge>
        </div>
        <p className="text-4xl font-black text-white mt-4 tracking-tight">{data.price}</p>
      </div>
      <CardContent className="pt-5 pb-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {DETAIL_ROWS.map((row) => (
            <div key={row.key}>
              <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {row.label}
              </dt>
              <dd className="font-semibold mt-0.5">{String(data[row.key])}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

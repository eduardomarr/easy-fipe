import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { FipePrice } from '@/types/fipe'

interface Props {
  data: FipePrice
}

const DETAIL_ROWS = [
  { label: 'Marca', key: 'brand' },
  { label: 'Modelo', key: 'model' },
  { label: 'Ano modelo', key: 'modelYear' },
  { label: 'Combustivel', key: 'fuel' },
  { label: 'Codigo FIPE', key: 'fipeCode' },
  { label: 'Mes referencia', key: 'referenceMonth' },
] as const

export function FipeResult({ data }: Props) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-lg shadow-primary/5">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
              {data.referenceMonth}
            </p>
            <p className="text-base font-semibold mt-1 truncate">
              {data.brand} {data.model}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px] border-border/60">
            {data.fuelAcronym}
          </Badge>
        </div>
        <p className="text-4xl font-sans font-black text-primary mt-4 tracking-tight leading-none">
          {data.price}
        </p>
      </div>
      <Separator className="opacity-50" />
      <CardContent className="pt-5 pb-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
          {DETAIL_ROWS.map((row) => (
            <div key={row.key}>
              <dt className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {row.label}
              </dt>
              <dd className="font-medium mt-0.5">{String(data[row.key])}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

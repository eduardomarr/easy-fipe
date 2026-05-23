import { Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { FipePrice } from '@/types/fipe'

interface Props {
  data: FipePrice
  isFavorited?: boolean
  onToggleFavorite?: () => void
}

const DETAIL_ROWS = [
  { label: 'Marca', key: 'brand' },
  { label: 'Modelo', key: 'model' },
  { label: 'Ano modelo', key: 'modelYear' },
  { label: 'Combustivel', key: 'fuel' },
  { label: 'Codigo FIPE', key: 'fipeCode' },
  { label: 'Mes referencia', key: 'referenceMonth' },
] as const

export function FipeResult({ data, isFavorited, onToggleFavorite }: Props) {
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
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] border-border/60">
              {data.fuelAcronym}
            </Badge>
            {onToggleFavorite !== undefined && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleFavorite}
                aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className={cn(
                  'size-7 transition-colors',
                  isFavorited
                    ? 'text-primary hover:text-primary/80'
                    : 'text-muted-foreground hover:text-primary',
                )}
              >
                <Heart
                  className="size-4"
                  fill={isFavorited ? 'currentColor' : 'none'}
                />
              </Button>
            )}
          </div>
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

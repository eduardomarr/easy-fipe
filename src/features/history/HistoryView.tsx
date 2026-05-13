import { Clock, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { track } from '@/lib/analytics'
import { useFipeStore } from '@/store/fipeStore'
import type { VehicleType } from '@/types/fipe'

const TYPE_LABELS: Record<VehicleType, string> = {
  cars: 'Carro',
  motorcycles: 'Moto',
  trucks: 'Caminhão',
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function HistoryView() {
  const { history, removeFromHistory, clearHistory } = useFipeStore()

  function handleClear() {
    track('history_cleared')
    clearHistory()
  }

  function handleRemove(id: string) {
    track('history_entry_removed')
    removeFromHistory(id)
  }

  if (history.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Clock className="size-8 text-muted-foreground/40" />
        </div>
        <p className="font-semibold">Nenhuma consulta ainda</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          As consultas realizadas na busca FIPE aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {history.length} consulta{history.length !== 1 ? 's' : ''} no total
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleClear}
        >
          Limpar tudo
        </Button>
      </div>

      <div className="space-y-2">
        {history.map((entry) => {
          function handleRemoveEntry() {
            handleRemove(entry.id)
          }
          return (
            <Card key={entry.id} className="border-border/50">
              <CardContent className="flex items-center gap-3 px-4 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-sm font-bold text-primary">
                    {entry.brandName.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">
                      {entry.brandName} {entry.modelName}
                    </p>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {TYPE_LABELS[entry.vehicleType]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {entry.yearName} · FIPE {entry.fipeCode} · {entry.referenceMonth}
                  </p>
                </div>
                <div className="mr-1 shrink-0 text-right">
                  <p className="font-sans text-base font-bold text-primary">{entry.price}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(entry.searchedAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleRemoveEntry}
                  aria-label="Remover consulta"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

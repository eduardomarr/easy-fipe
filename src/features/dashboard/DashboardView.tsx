import { Car, Clock, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFipeStore } from '@/store/fipeStore'
import type { VehicleType } from '@/types/fipe'

const VEHICLE_LABELS: Record<VehicleType, string> = {
  cars: 'Carros',
  motorcycles: 'Motos',
  trucks: 'Caminhões',
}

interface Props {
  onGoToSearch: () => void
}

export function DashboardView({ onGoToSearch }: Props) {
  const history = useFipeStore((s) => s.history)
  const navigate = useNavigate()

  const uniqueCodes = new Set(history.map((h) => h.fipeCode)).size
  const lastSearch = history[0]

  const byType = history.reduce<Record<string, number>>((acc, h) => {
    acc[h.vehicleType] = (acc[h.vehicleType] ?? 0) + 1
    return acc
  }, {})

  function handleGoHistory() {
    navigate('/app/history')
  }

  if (history.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Car className="size-8 text-muted-foreground/40" />
        </div>
        <p className="font-semibold">Sem consultas ainda</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Faça sua primeira busca FIPE para ver o dashboard com estatísticas.
        </p>
        <Button size="sm" className="mt-5" onClick={onGoToSearch}>
          Buscar veículo
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-6 py-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Consultas', value: history.length },
          { label: 'Veículos únicos', value: uniqueCodes },
          { label: 'Tipos consultados', value: Object.keys(byType).length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="font-sans text-4xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="cursor-pointer border-primary/20 bg-primary/5 transition-colors hover:bg-primary/10"
          onClick={onGoToSearch}
        >
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Search className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Nova busca</p>
              <p className="text-xs text-muted-foreground">Consulte um veículo</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={handleGoHistory}
        >
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Ver histórico</p>
              <p className="text-xs text-muted-foreground">
                {history.length} consulta{history.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last search */}
      {lastSearch && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última consulta
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <span className="text-sm font-bold text-primary">
                  {lastSearch.brandName.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {lastSearch.brandName} {lastSearch.modelName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSearch.yearName} · FIPE {lastSearch.fipeCode}
                </p>
              </div>
              <p className="shrink-0 font-sans text-xl font-bold text-primary">
                {lastSearch.price}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution by type */}
      {Object.keys(byType).length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Por tipo de veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <p className="w-24 shrink-0 text-xs text-muted-foreground">
                  {VEHICLE_LABELS[type as VehicleType] ?? type}
                </p>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(count / history.length) * 100}%` }}
                  />
                </div>
                <p className="w-4 shrink-0 text-right text-xs font-medium">{count}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

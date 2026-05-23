import { Heart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { track } from '@/lib/analytics'
import { useFavorites, useRemoveFavorite } from './hooks/useFavorites'

export function FavoritesView() {
  const { data: favorites = [], isLoading } = useFavorites()
  const removeMutation = useRemoveFavorite()

  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[60px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Heart className="size-8 text-muted-foreground/40" />
        </div>
        <p className="font-semibold">Nenhum favorito ainda</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Salve veículos como favoritos na busca FIPE para vê-los aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <p className="mb-4 text-sm text-muted-foreground">
        {favorites.length} veículo{favorites.length !== 1 ? 's' : ''} favorito
        {favorites.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-2">
        {favorites.map((entry) => {
          function handleRemove() {
            track('favorite_removed_from_list', { fipe_code: entry.fipeCode })
            removeMutation.mutate(entry.fipeCode)
          }
          return (
            <Card key={entry.fipeCode} className="border-border/50">
              <CardContent className="flex items-center gap-3 px-4 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-sm font-bold text-primary">
                    {entry.vehicleLabel.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.vehicleLabel}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">FIPE {entry.fipeCode}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleRemove}
                  aria-label="Remover favorito"
                  disabled={removeMutation.isPending}
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

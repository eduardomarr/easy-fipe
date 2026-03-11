import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HistoryEntry } from '@/types/fipe'

interface Props {
  history: HistoryEntry[]
  onRemove: (id: string) => void
  onClear: () => void
}

export function RecentSearches({ history, onRemove, onClear }: Props) {
  if (history.length === 0) return null

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Consultas recentes</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-auto py-1 text-muted-foreground cursor-pointer" onClick={onClear}>
            Limpar tudo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/60">
          {history.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-2.5 gap-2">
              <div className="min-w-0 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {entry.brandName.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entry.brandName} {entry.modelName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.yearName} ·{' '}
                    <span className="font-semibold text-primary">{entry.price}</span>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive shrink-0 h-auto py-1 px-2 cursor-pointer"
                onClick={() => onRemove(entry.id)}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

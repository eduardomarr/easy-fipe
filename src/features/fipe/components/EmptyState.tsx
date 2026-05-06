import { Search } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Search className="size-7 text-primary/60" />
      </div>
      <div>
        <p className="text-sm font-medium">Pronto para consultar</p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-[260px] leading-relaxed">
          Selecione marca, modelo e ano para ver o valor FIPE
        </p>
      </div>
    </div>
  )
}

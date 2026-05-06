import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Skeleton } from '@/components/ui/skeleton'
import type { FipeOption } from '@/types/fipe'

interface Props {
  options: FipeOption[]
  value: string | null
  isLoading: boolean
  onChange: (code: string, name: string) => void
  onClear: () => void
}

export function BrandSelect({ options, value, isLoading, onChange, onClear }: Props) {
  if (isLoading) {
    return (
      <div>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Marca</span>
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    )
  }

  const selected = options.find((o) => o.code === value) ?? null

  return (
    <div>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Marca</span>
      <Combobox<FipeOption>
        value={selected}
        onValueChange={(item) => {
          if (item) onChange(item.code, item.name)
          else onClear()
        }}
        items={options}
        itemToStringLabel={(item) => item.name}
        itemToStringValue={(item) => item.name}
        isItemEqualToValue={(a, b) => a.code === b.code}
        autoHighlight
      >
        <ComboboxInput placeholder="Buscar marca..." className="w-full" showClear={!!value} />
        <ComboboxContent>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.code} value={item}>
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>Nenhuma marca encontrada</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

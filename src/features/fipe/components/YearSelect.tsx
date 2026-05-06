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
  disabled: boolean
  onChange: (code: string, name: string) => void
  onClear: () => void
}

export function YearSelect({ options, value, isLoading, disabled, onChange, onClear }: Props) {
  if (isLoading) {
    return (
      <div>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Ano</span>
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    )
  }

  const selected = options.find((o) => o.code === value) ?? null

  return (
    <div>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Ano</span>
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
        disabled={disabled}
        autoHighlight
      >
        <ComboboxInput placeholder="Selecionar ano..." className="w-full" disabled={disabled} showClear={!!value} />
        <ComboboxContent>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.code} value={item}>
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>Nenhum ano encontrado</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

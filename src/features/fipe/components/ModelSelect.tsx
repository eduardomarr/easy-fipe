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
}

export function ModelSelect({ options, value, isLoading, disabled, onChange }: Props) {
  if (isLoading) {
    return <Skeleton className="h-8 w-full rounded-lg" />
  }

  const selected = options.find((o) => o.code === value) ?? null

  return (
    <Combobox<FipeOption>
      value={selected}
      onValueChange={(item) => {
        if (item) onChange(item.code, item.name)
      }}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.name}
      isItemEqualToValue={(a, b) => a.code === b.code}
      disabled={disabled}
      autoHighlight
    >
      <ComboboxInput placeholder="Selecione o modelo" className="w-full" disabled={disabled} showClear={!!value} />
      <ComboboxContent>
        <ComboboxList>
          {options.map((opt) => (
            <ComboboxItem key={opt.code} value={opt}>
              {opt.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>Nenhum modelo encontrado</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}

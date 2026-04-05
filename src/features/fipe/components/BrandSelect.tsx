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
    return <Skeleton className="h-8 w-full rounded-lg" />
  }

  const selected = options.find((o) => o.code === value) ?? null

  return (
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
      <ComboboxInput placeholder="Selecione a marca" className="w-full" showClear={!!value} />
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
  )
}

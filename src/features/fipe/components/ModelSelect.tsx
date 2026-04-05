import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Skeleton } from '@/components/ui/skeleton'
import { track } from '@/lib/analytics'
import type { FipeOption } from '@/types/fipe'

interface Props {
  options: FipeOption[]
  value: string | null
  isLoading: boolean
  disabled: boolean
  onChange: (code: string, name: string) => void
  onClear: () => void
}

export function ModelSelect({ options, value, isLoading, disabled, onChange, onClear }: Props) {
  if (isLoading) {
    return <Skeleton className="h-8 w-full rounded-lg" />
  }

  const selected = options.find((o) => o.code === value) ?? null

  return (
    <Combobox<FipeOption>
      value={selected}
      onValueChange={(item) => {
        if (item) { track('model_selected', { model_code: item.code, model_name: item.name }); onChange(item.code, item.name) }
        else { track('model_cleared'); onClear() }
      }}
      items={options}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.name}
      isItemEqualToValue={(a, b) => a.code === b.code}
      disabled={disabled}
      autoHighlight
    >
      <ComboboxInput placeholder="Selecione o modelo" className="w-full" disabled={disabled} showClear={!!value} />
      <ComboboxContent>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.code} value={item}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
        <ComboboxEmpty>Nenhum modelo encontrado</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}

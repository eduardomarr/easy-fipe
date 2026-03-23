import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { FipeOption } from '@/types/fipe'

interface Props {
  options: FipeOption[]
  value: string | null
  isLoading: boolean
  disabled: boolean
  onChange: (code: string, name: string) => void
}

export function YearSelect({ options, value, isLoading, disabled, onChange }: Props) {
  if (isLoading) {
    return <Skeleton className="h-8 w-full rounded-lg" />
  }

  return (
    <Select
      value={value ?? ''}
      onValueChange={(code) => {
        const opt = options.find((o) => o.code === code)
        if (opt) onChange(opt.code, opt.name)
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione o ano">
          {options.find((o) => o.code === value)?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.code} value={opt.code}>
            {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

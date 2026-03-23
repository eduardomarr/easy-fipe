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
  onChange: (code: string, name: string) => void
}

export function BrandSelect({ options, value, isLoading, onChange }: Props) {
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
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione a marca">
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

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { HistoryEntry } from '@/types/fipe'

interface Props {
  history: HistoryEntry[]
  fipeCode: string
}

function parsePrice(price: string): number {
  return parseFloat(price.replace('R$ ', '').replace(/\./g, '').replace(',', '.'))
}

export function PriceHistoryChart({ history, fipeCode }: Props) {
  const filtered = history
    .filter((h) => h.fipeCode === fipeCode)
    .sort((a, b) => a.searchedAt.localeCompare(b.searchedAt))

  if (filtered.length < 2) {
    return (
      <Card className="border border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Histórico de preços</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Consulte novamente ao longo do tempo para ver o histórico de preços
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartData = filtered.map((h) => ({
    month: h.referenceMonth,
    value: parsePrice(h.price),
  }))

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Histórico de preços</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ value: { label: 'Valor FIPE', color: 'var(--chart-1)' } }}
          className="h-52 w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
              }
              width={90}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v) =>
                    `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              fill="url(#colorValue)"
              dot={{ r: 4, fill: 'var(--chart-1)', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: 'var(--chart-1)' }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

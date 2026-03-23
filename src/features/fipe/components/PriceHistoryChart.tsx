import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { PeriodFilter } from '@/types/fipe'
import { usePriceHistory } from '../hooks/usePriceHistory'

interface Props {
  fipeCode: string
  modelYear: number
}

const PERIODS: PeriodFilter[] = ['6M', '1A', '2A', '3A', 'Tudo']

export function PriceHistoryChart({ fipeCode, modelYear }: Props) {
  const [period, setPeriod] = useState<PeriodFilter>('1A')
  const { data, totalMonths, loadedMonths, isLoading } = usePriceHistory(
    fipeCode,
    modelYear,
    period,
  )

  const showSkeleton = isLoading && data.length === 0

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">Histórico de preços</CardTitle>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                  p === period
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {isLoading && totalMonths > 0 && (
          <p className="text-xs text-muted-foreground">
            Carregando {loadedMonths}/{totalMonths} meses...
          </p>
        )}
      </CardHeader>
      <CardContent>
        {showSkeleton && <Skeleton className="h-52 w-full rounded-md" />}

        {!showSkeleton && data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum dado histórico disponível para este veículo
          </p>
        )}

        {data.length > 0 && (
          <ChartContainer
            config={{ value: { label: 'Valor FIPE', color: 'var(--chart-1)' } }}
            className="h-52 w-full"
          >
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={Math.max(Math.ceil(data.length / 8) - 1, 0)}
                tickFormatter={(month: string) => {
                  const [m, y] = month.split('/')
                  return `${m.slice(0, 3)}/${y?.slice(2) ?? ''}`
                }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                }
                width={90}
                domain={[
                  (dataMin: number) => Math.floor((dataMin * 0.92) / 1000) * 1000,
                  (dataMax: number) => Math.ceil((dataMax * 1.02) / 1000) * 1000,
                ]}
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
        )}
      </CardContent>
    </Card>
  )
}

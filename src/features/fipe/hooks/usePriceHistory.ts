import { useQuery, useQueries } from '@tanstack/react-query'
import { fetchReferenceTables, fetchHistoricalPrice } from '@/api/brasilapi'
import type { PeriodFilter, PriceHistoryPoint } from '@/types/fipe'
import { fipeKeys } from './useBrands'
import { ONE_WEEK } from '@/constants/cachePeriods'

const PERIOD_MONTHS: Record<PeriodFilter, number> = {
  '6M': 6,
  '1A': 12,
  '2A': 24,
  '3A': 36,
  'Tudo': 36,
}

function parsePrice(valor: string): number {
  return parseFloat(valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.'))
}

export function usePriceHistory(
  fipeCode: string | undefined,
  modelYear: number | undefined,
  period: PeriodFilter,
) {
  const monthCount = PERIOD_MONTHS[period]

  const tablesQuery = useQuery({
    queryKey: fipeKeys.referenceTables(),
    queryFn: fetchReferenceTables,
    enabled: !!fipeCode,
    staleTime: ONE_WEEK,
  })

  const tables = tablesQuery.data?.slice(0, monthCount) ?? []

  const priceQueries = useQueries({
    queries: tables.map((table) => ({
      queryKey: fipeKeys.historicalPrice(fipeCode!, table.codigo),
      queryFn: () => fetchHistoricalPrice(fipeCode!, table.codigo),
      enabled: !!fipeCode && !!modelYear,
      select: (data: Awaited<ReturnType<typeof fetchHistoricalPrice>>) => {
        const match = data.find((item) => item.anoModelo === modelYear)
        if (!match) return null
        return {
          month: table.mes,
          monthCode: table.codigo,
          value: parsePrice(match.valor),
        } satisfies PriceHistoryPoint
      },
      staleTime: ONE_WEEK,
    })),
  })

  const data: PriceHistoryPoint[] = priceQueries
    .map((q) => q.data)
    .filter((d): d is PriceHistoryPoint => d != null)
    .reverse()

  const totalMonths = tables.length
  const loadedMonths = priceQueries.filter((q) => q.isSuccess).length
  const isLoading = tablesQuery.isLoading || priceQueries.some((q) => q.isLoading)

  return { data, totalMonths, loadedMonths, isLoading }
}

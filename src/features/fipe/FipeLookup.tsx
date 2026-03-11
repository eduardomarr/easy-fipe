import { useEffect, useRef } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFipeStore } from '@/store/fipeStore'
import type { HistoryEntry } from '@/types/fipe'
import { useBrands } from './hooks/useBrands'
import { useFipePrice } from './hooks/useFipePrice'
import { useModels } from './hooks/useModels'
import { useYears } from './hooks/useYears'
import { BrandSelect } from './components/BrandSelect'
import { EmptyState } from './components/EmptyState'
import { FipeResult } from './components/FipeResult'
import { FipeResultSkeleton } from './components/FipeResultSkeleton'
import { ModelSelect } from './components/ModelSelect'
import { YearSelect } from './components/YearSelect'
import { PriceHistoryChart } from './components/PriceHistoryChart'
import { RecentSearches } from './components/RecentSearches'
import { VehicleTypeSelector } from './components/VehicleTypeSelector'

export function FipeLookup() {
  const {
    selection,
    history,
    setVehicleType,
    setBrand,
    setModel,
    setYear,
    addToHistory,
    removeFromHistory,
    clearHistory,
  } = useFipeStore()

  const { vehicleType, brandCode, modelCode, yearCode } = selection

  const brands = useBrands(vehicleType)
  const models = useModels(vehicleType, brandCode)
  const years = useYears(vehicleType, brandCode, modelCode)
  const price = useFipePrice(vehicleType, brandCode, modelCode, yearCode)

  // Track whether we've already added this price result to avoid double-add in StrictMode
  const addedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!price.data) return
    const key = `${price.data.fipeCode}:${price.data.referenceMonth}`
    if (addedRef.current === key) return
    addedRef.current = key

    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      searchedAt: new Date().toISOString(),
      vehicleType,
      brandName: selection.brandName ?? '',
      modelName: selection.modelName ?? '',
      yearName: selection.yearName ?? '',
      price: price.data.price,
      fipeCode: price.data.fipeCode,
      referenceMonth: price.data.referenceMonth,
    }
    addToHistory(entry)
  }, [price.data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset the ref when the query changes so the new result can be added
  useEffect(() => {
    addedRef.current = null
  }, [vehicleType, brandCode, modelCode, yearCode])

  return (
    <div className="space-y-4">
      <VehicleTypeSelector value={vehicleType} onChange={setVehicleType} />

      <BrandSelect
        options={brands.data ?? []}
        value={brandCode}
        isLoading={brands.isLoading}
        onChange={setBrand}
      />

      <ModelSelect
        options={models.data ?? []}
        value={modelCode}
        isLoading={models.isLoading}
        disabled={!brandCode}
        onChange={setModel}
      />

      <YearSelect
        options={years.data ?? []}
        value={yearCode}
        isLoading={years.isLoading}
        disabled={!modelCode}
        onChange={setYear}
      />

      {price.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao consultar o valor FIPE. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      )}

      {!yearCode && !price.isLoading && <EmptyState />}

      {price.isLoading && yearCode && <FipeResultSkeleton />}

      {price.data && <FipeResult data={price.data} />}

      {price.data && (
        <PriceHistoryChart history={history} fipeCode={price.data.fipeCode} />
      )}

      <RecentSearches history={history} onRemove={removeFromHistory} onClear={clearHistory} />
    </div>
  )
}

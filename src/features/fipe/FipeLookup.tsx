import { useEffect, useRef } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { track } from '@/lib/analytics'
import { useFipeStore } from '@/store/fipeStore'
import type { HistoryEntry, VehicleType } from '@/types/fipe'
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
    clearBrand,
    clearModel,
    clearYear,
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

    track('price_lookup_completed', {
      fipe_code: price.data.fipeCode,
      brand: price.data.brand,
      model: price.data.model,
      price: price.data.price,
      reference_month: price.data.referenceMonth,
    })

    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      searchedAt: new Date().toISOString(),
      vehicleType,
      brandCode: selection.brandCode ?? undefined,
      brandName: selection.brandName ?? '',
      modelCode: selection.modelCode ?? undefined,
      modelName: selection.modelName ?? '',
      yearCode: selection.yearCode ?? undefined,
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

  useEffect(() => {
    if (price.isError) track('price_lookup_error')
  }, [price.isError])

  const handleVehicleTypeChange = (type: VehicleType) => {
    track('vehicle_type_selected', { vehicle_type: type })
    setVehicleType(type)
  }

  const handleBrandChange = (code: string, name: string) => {
    track('brand_selected', { brand_code: code, brand_name: name })
    setBrand(code, name)
  }

  const handleBrandClear = () => {
    track('brand_cleared')
    clearBrand()
  }

  const handleModelChange = (code: string, name: string) => {
    track('model_selected', { model_code: code, model_name: name })
    setModel(code, name)
  }

  const handleModelClear = () => {
    track('model_cleared')
    clearModel()
  }

  const handleYearChange = (code: string, name: string) => {
    track('year_selected', { year_code: code, year_name: name })
    setYear(code, name)
  }

  const handleYearClear = () => {
    track('year_cleared')
    clearYear()
  }

  const handleSelectHistory = (entry: HistoryEntry) => {
    if (!entry.brandCode || !entry.modelCode || !entry.yearCode) return
    track('history_entry_selected', { fipe_code: entry.fipeCode, brand_name: entry.brandName, model_name: entry.modelName })
    setVehicleType(entry.vehicleType)
    setBrand(entry.brandCode, entry.brandName)
    setModel(entry.modelCode, entry.modelName)
    setYear(entry.yearCode, entry.yearName)
  }

  const handleRemoveHistory = (id: string) => {
    track('history_entry_removed')
    removeFromHistory(id)
  }

  const handleClearHistory = () => {
    track('history_cleared')
    clearHistory()
  }

  return (
    <div className="space-y-4">
      <VehicleTypeSelector value={vehicleType} onChange={handleVehicleTypeChange} />

      <BrandSelect
        options={brands.data ?? []}
        value={brandCode}
        isLoading={brands.isLoading}
        onChange={handleBrandChange}
        onClear={handleBrandClear}
      />

      <ModelSelect
        options={models.data ?? []}
        value={modelCode}
        isLoading={models.isLoading}
        disabled={!brandCode}
        onChange={handleModelChange}
        onClear={handleModelClear}
      />

      <YearSelect
        options={years.data ?? []}
        value={yearCode}
        isLoading={years.isLoading}
        disabled={!modelCode}
        onChange={handleYearChange}
        onClear={handleYearClear}
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
        <PriceHistoryChart fipeCode={price.data.fipeCode} modelYear={price.data.modelYear} />
      )}

      <RecentSearches history={history} onRemove={handleRemoveHistory} onClear={handleClearHistory} onSelect={handleSelectHistory} />
    </div>
  )
}

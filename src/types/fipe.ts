export type VehicleType = 'cars' | 'motorcycles' | 'trucks'

export interface FipeOption {
  code: string
  name: string
}

export interface FipePrice {
  vehicleType: string
  brand: string
  model: string
  modelYear: number
  fuel: string
  fipeCode: string
  referenceMonth: string
  price: string
  fuelAcronym: string
}

export interface SelectionState {
  vehicleType: VehicleType
  brandCode: string | null
  brandName: string | null
  modelCode: string | null
  modelName: string | null
  yearCode: string | null
  yearName: string | null
}

export interface HistoryEntry {
  id: string
  searchedAt: string
  vehicleType: VehicleType
  brandName: string
  modelName: string
  yearName: string
  price: string
  fipeCode: string
  referenceMonth: string
}

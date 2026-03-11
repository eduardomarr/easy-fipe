import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HistoryEntry, SelectionState, VehicleType } from '@/types/fipe'

interface FipeStore {
  selection: SelectionState
  history: HistoryEntry[]

  setVehicleType: (type: VehicleType) => void
  setBrand: (code: string, name: string) => void
  setModel: (code: string, name: string) => void
  setYear: (code: string, name: string) => void

  addToHistory: (entry: HistoryEntry) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
}

const defaultSelection: SelectionState = {
  vehicleType: 'cars',
  brandCode: null,
  brandName: null,
  modelCode: null,
  modelName: null,
  yearCode: null,
  yearName: null,
}

export const useFipeStore = create<FipeStore>()(
  persist(
    (set) => ({
      selection: defaultSelection,
      history: [],

      setVehicleType: (type) =>
        set((s) => ({
          selection: { ...defaultSelection, vehicleType: type },
          history: s.history,
        })),

      setBrand: (code, name) =>
        set((s) => ({
          selection: {
            ...s.selection,
            brandCode: code,
            brandName: name,
            modelCode: null,
            modelName: null,
            yearCode: null,
            yearName: null,
          },
        })),

      setModel: (code, name) =>
        set((s) => ({
          selection: {
            ...s.selection,
            modelCode: code,
            modelName: name,
            yearCode: null,
            yearName: null,
          },
        })),

      setYear: (code, name) =>
        set((s) => ({
          selection: { ...s.selection, yearCode: code, yearName: name },
        })),

      addToHistory: (entry) =>
        set((s) => {
          const existing = s.history.findIndex(
            (h) => h.fipeCode === entry.fipeCode && h.referenceMonth === entry.referenceMonth,
          )
          if (existing >= 0) {
            const updated = [...s.history]
            updated[existing] = { ...updated[existing], ...entry, id: updated[existing].id }
            return { history: updated }
          }
          return { history: [entry, ...s.history] }
        }),

      removeFromHistory: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'fipe-storage',
      partialize: (s) => ({ history: s.history }),
    },
  ),
)

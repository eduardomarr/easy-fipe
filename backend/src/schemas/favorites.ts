import { z } from 'zod'

export const createFavoriteSchema = z.object({
  fipeCode: z.string().min(1),
  vehicleLabel: z.string().min(1),
})

export type CreateFavoriteInput = z.infer<typeof createFavoriteSchema>

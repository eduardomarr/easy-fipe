import { z } from 'zod'

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  role: z.enum(['admin', 'standard']),
  notificationEmailOptIn: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type UserResponse = z.infer<typeof userResponseSchema>

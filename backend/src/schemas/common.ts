import { z } from 'zod'

export const uuidSchema = z.string().uuid()
export const emailSchema = z.string().email()

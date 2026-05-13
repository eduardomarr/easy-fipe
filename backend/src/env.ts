import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1).default('re_placeholder'),
  WORKER_SECRET: z.string().min(1).default('dev-worker-secret'),
  FIPE_API_BASE: z.string().url().default('https://fipe.parallelum.com.br/api/v2'),
})

export const env = schema.parse(process.env)
export type Env = z.infer<typeof schema>

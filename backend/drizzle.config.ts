import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const url = process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL or MIGRATIONS_DATABASE_URL is required')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/*.ts',
  out: './drizzle',
  dbCredentials: { url },
  strict: true,
  verbose: true,
})

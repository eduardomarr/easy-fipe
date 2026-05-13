import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL or MIGRATIONS_DATABASE_URL is required')
}

const sql = postgres(url, { max: 1 })
await migrate(drizzle(sql), { migrationsFolder: './drizzle' })
await sql.end()
console.log('migrations applied')

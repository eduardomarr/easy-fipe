import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, beforeEach } from 'vitest'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL not set for tests')

const sql = postgres(url, { max: 1 })
const db = drizzle(sql)

beforeAll(async () => {
  await migrate(db, { migrationsFolder: './drizzle' })
})

beforeEach(async () => {
  await sql`TRUNCATE TABLE notification_logs, favorites, price_snapshots, users RESTART IDENTITY CASCADE`
})

afterAll(async () => {
  await sql.end()
})

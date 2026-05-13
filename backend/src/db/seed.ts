import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './schema/users.js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@easyfipe.local'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin1234!'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const databaseUrl = process.env.DATABASE_URL

if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL are required')
}

const adminHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${serviceRoleKey}`,
  apikey: serviceRoleKey,
}

async function findUserByEmail(email: string): Promise<string | null> {
  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers: adminHeaders },
  )
  if (!res.ok) return null
  const body = (await res.json()) as { users?: { id: string; email: string }[] }
  const match = body.users?.find((u) => u.email === email)
  return match?.id ?? null
}

async function createAuthUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  })

  if (res.status === 422) {
    console.log('Auth user already exists, looking up existing id...')
    const existingId = await findUserByEmail(email)
    if (!existingId) throw new Error('Could not find existing auth user')
    return existingId
  }

  if (!res.ok) {
    throw new Error(`Supabase admin API error ${res.status}: ${await res.text()}`)
  }

  const body = (await res.json()) as { id: string }
  return body.id
}

const userId = await createAuthUser(ADMIN_EMAIL, ADMIN_PASSWORD)

const sql = postgres(databaseUrl, { max: 1 })
const db = drizzle(sql)

await db
  .insert(users)
  .values({ id: userId, email: ADMIN_EMAIL, fullName: 'Admin' })
  .onConflictDoNothing()

await sql.end()

console.log(`Admin user ready — email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`)

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './schema/users.js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const databaseUrl = process.env.DATABASE_URL

if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL are required')
}

const SEED_USERS = [
  { email: 'dado.nep@gmail.com', password: 'Admin1234!', fullName: 'Eduardo', role: 'admin' as const },
  { email: 'user@test.com', password: 'User1234!', fullName: 'Test User', role: 'standard' as const },
]

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

const sql = postgres(databaseUrl, { max: 1 })
const db = drizzle(sql)

for (const u of SEED_USERS) {
  const userId = await createAuthUser(u.email, u.password)
  await db
    .insert(users)
    .values({ id: userId, email: u.email, fullName: u.fullName, role: u.role })
    .onConflictDoNothing()
  console.log(`User ready — email: ${u.email}  role: ${u.role}`)
}

await sql.end()

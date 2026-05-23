import { and, eq, isNull } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { requireAuth } from '../middleware/auth.js'

export const meRouter = Router()

meRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id
  await db
    .insert(users)
    .values({ id: userId, email: req.user!.email ?? '' })
    .onConflictDoNothing()
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1)
  if (!row) {
    res.status(404).json({ error: 'user_not_found' })
    return
  }
  res.json(row)
})

meRouter.patch('/notifications/opt-in', requireAuth, async (req, res) => {
  const userId = req.user!.id
  const [row] = await db
    .update(users)
    .set({ notificationEmailOptIn: true })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .returning()
  if (!row) {
    res.status(404).json({ error: 'user_not_found' })
    return
  }
  res.json(row)
})

meRouter.patch('/notifications/opt-out', requireAuth, async (req, res) => {
  const userId = req.user!.id
  const [row] = await db
    .update(users)
    .set({ notificationEmailOptIn: false })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .returning()
  if (!row) {
    res.status(404).json({ error: 'user_not_found' })
    return
  }
  res.json(row)
})

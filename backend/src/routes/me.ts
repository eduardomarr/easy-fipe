import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { requireAuth } from '../middleware/auth.js'

export const meRouter = Router()

meRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
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
    .where(eq(users.id, userId))
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
    .where(eq(users.id, userId))
    .returning()
  if (!row) {
    res.status(404).json({ error: 'user_not_found' })
    return
  }
  res.json(row)
})

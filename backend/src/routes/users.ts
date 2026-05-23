import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

export const usersRouter = Router()

usersRouter.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt))
  res.json(rows)
})

usersRouter.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = req.params['id'] as string
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1)
  if (!row) {
    res.status(404).json({ error: 'user_not_found' })
    return
  }
  res.json(row)
})

usersRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = req.params['id'] as string
  if (id === req.user!.id) {
    res.status(400).json({ error: 'cannot_delete_self' })
    return
  }
  const [row] = await db
    .update(users)
    .set({ deletedAt: sql`now()` })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning()
  if (!row) {
    res.status(404).json({ error: 'user_not_found' })
    return
  }
  res.status(204).send()
})

import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client.js'
import { favorites, users } from '../db/schema.js'
import { requireAuth } from '../middleware/auth.js'
import { createFavoriteSchema } from '../schemas/favorites.js'

export const favoritesRouter = Router()

favoritesRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt))
  res.json(rows)
})

favoritesRouter.post('/', requireAuth, async (req, res) => {
  const userId = req.user!.id
  await db
    .insert(users)
    .values({ id: userId, email: req.user!.email ?? '' })
    .onConflictDoNothing()
  const parsed = createFavoriteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() })
    return
  }
  const { fipeCode, vehicleLabel } = parsed.data
  const [row] = await db
    .insert(favorites)
    .values({ userId, fipeCode, vehicleLabel })
    .onConflictDoNothing()
    .returning()
  if (!row) {
    const [existing] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.fipeCode, fipeCode)))
      .limit(1)
    res.status(200).json(existing)
    return
  }
  res.status(201).json(row)
})

favoritesRouter.delete('/:fipeCode', requireAuth, async (req, res) => {
  const userId = req.user!.id
  const fipeCode = req.params['fipeCode'] as string
  const [deleted] = await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.fipeCode, fipeCode)))
    .returning()
  if (!deleted) {
    res.status(404).json({ error: 'favorite_not_found' })
    return
  }
  res.status(204).send()
})

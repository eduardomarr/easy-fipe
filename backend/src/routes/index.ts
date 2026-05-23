import { Router } from 'express'
import { healthRouter } from './health.js'
import { meRouter } from './me.js'
import { fipeRouter } from './fipe.js'
import { favoritesRouter } from './favorites.js'
import { usersRouter } from './users.js'
import { workerRouter } from './worker.js'

export function buildRouter(): Router {
  const router = Router()
  router.use('/health', healthRouter)
  router.use('/me', meRouter)
  router.use('/api', fipeRouter)
  router.use('/favorites', favoritesRouter)
  router.use('/users', usersRouter)
  router.use('/worker', workerRouter)
  return router
}

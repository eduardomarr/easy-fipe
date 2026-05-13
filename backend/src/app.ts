import express from 'express'
import { errorHandler } from './middleware/error.js'
import { buildRouter } from './routes/index.js'

export function createApp(): express.Express {
  const app = express()
  app.use(express.json({ limit: '32kb' }))
  app.use(buildRouter())
  app.use(errorHandler)
  return app
}

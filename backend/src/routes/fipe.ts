import { Router } from 'express'
import type { Request, Response } from 'express'

export const fipeRouter = Router()

fipeRouter.get('/v2/*', async (req: Request, res: Response) => {
  const qs = new URLSearchParams(req.query as Record<string, string>).toString()
  const upstream = `https://fipe.parallelum.com.br/api/v2${req.path}${qs ? `?${qs}` : ''}`
  const response = await fetch(upstream)
  if (!response.ok) {
    res.status(response.status).json({ error: 'upstream_error', status: response.status })
    return
  }
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.json(await response.json())
})

fipeRouter.get('/brasilapi/*', async (req: Request, res: Response) => {
  const upstreamPath = req.path.replace(/^\/brasilapi/, '')
  const qs = new URLSearchParams(req.query as Record<string, string>).toString()
  const upstream = `https://brasilapi.com.br/api${upstreamPath}${qs ? `?${qs}` : ''}`
  const response = await fetch(upstream)
  if (!response.ok) {
    res.status(response.status).json({ error: 'upstream_error', status: response.status })
    return
  }
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.json(await response.json())
})

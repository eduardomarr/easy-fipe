import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { requireAuth } from '../middleware/auth.js'
import { generateToken } from './helpers.js'

function makeReqRes(authHeader?: string) {
  const req = { headers: { authorization: authHeader } } as unknown as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response
  const next = vi.fn() as unknown as NextFunction
  return { req, res, next }
}

describe('requireAuth middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const { req, res, next } = makeReqRes()
    await requireAuth(req, res, next)
    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(401)
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      error: 'missing_bearer_token',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header is not Bearer', async () => {
    const { req, res, next } = makeReqRes('Basic dXNlcjpwYXNz')
    await requireAuth(req, res, next)
    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(401)
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      error: 'missing_bearer_token',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token is malformed', async () => {
    const { req, res, next } = makeReqRes('Bearer not.a.valid.token')
    await requireAuth(req, res, next)
    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(401)
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      error: 'invalid_token',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token has no sub claim', async () => {
    const token = await generateToken({ sub: undefined })
    const { req, res, next } = makeReqRes(`Bearer ${token}`)
    await requireAuth(req, res, next)
    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(401)
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      error: 'invalid_token',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next and populates req.user for a valid token', async () => {
    const userId = crypto.randomUUID()
    const token = await generateToken({ sub: userId, email: 'user@test.com', role: 'authenticated' })
    const { req, res, next } = makeReqRes(`Bearer ${token}`)
    await requireAuth(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(req.user).toEqual({ id: userId, email: 'user@test.com', role: 'authenticated' })
  })
})

import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ZodError } from 'zod'
import { errorHandler } from '../middleware/error.js'

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response
}

const req = {} as Request
const next = vi.fn() as unknown as NextFunction

describe('errorHandler middleware', () => {
  it('returns 400 with validation_error for ZodError', () => {
    const result = z.object({ name: z.string() }).safeParse({})
    const err = result.success ? null : result.error
    const res = makeRes()
    errorHandler(err as ZodError, req, res, next)
    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(400)
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({
      error: 'validation_error',
      issues: expect.any(Array),
    })
  })

  it('returns 500 with internal_error for a generic Error', () => {
    const res = makeRes()
    errorHandler(new Error('boom'), req, res, next)
    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(500)
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      error: 'internal_error',
    })
  })
})

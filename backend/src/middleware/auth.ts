import type { NextFunction, Request, Response } from 'express'
import type { JWTVerifyGetKey } from 'jose'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../env.js'

let _jwks: JWTVerifyGetKey = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/keys`))

export function _setJWKSForTesting(jwks: JWTVerifyGetKey) {
  _jwks = jwks
}

export interface AuthUser {
  id: string
  email?: string
  role?: string
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing_bearer_token' })
    return
  }
  const token = header.slice('Bearer '.length)
  try {
    const { payload } = await jwtVerify(token, _jwks, {
      audience: 'authenticated',
    })
    if (!payload.sub) {
      res.status(401).json({ error: 'invalid_token' })
      return
    }
    req.user = {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: typeof payload.role === 'string' ? payload.role : undefined,
    }
    next()
  } catch {
    res.status(401).json({ error: 'invalid_token' })
  }
}

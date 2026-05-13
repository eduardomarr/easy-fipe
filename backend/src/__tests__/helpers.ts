import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose'
import { _setJWKSForTesting } from '../middleware/auth.js'

const { privateKey, publicKey } = await generateKeyPair('RS256')
const publicJwk = await exportJWK(publicKey)
const testJWKS = createLocalJWKSet({ keys: [{ ...publicJwk, use: 'sig', kid: 'test', alg: 'RS256' }] })

_setJWKSForTesting(testJWKS)

export async function generateToken(overrides: Record<string, unknown> = {}): Promise<string> {
  return new SignJWT({
    sub: crypto.randomUUID(),
    email: 'test@example.com',
    role: 'authenticated',
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setAudience('authenticated')
    .sign(privateKey)
}

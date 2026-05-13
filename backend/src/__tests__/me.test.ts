import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { createApp } from '../app.js'
import { generateToken } from './helpers.js'

describe('GET /me', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const app = createApp()
    const res = await request(app).get('/me')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'missing_bearer_token' })
  })

  it('returns 401 when token is invalid', async () => {
    const app = createApp()
    const res = await request(app).get('/me').set('Authorization', 'Bearer garbage')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'invalid_token' })
  })

  it('returns 404 when user does not exist in the database', async () => {
    const token = await generateToken()
    const app = createApp()
    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'user_not_found' })
  })

  it('returns 200 with user data when authenticated and user exists', async () => {
    const userId = crypto.randomUUID()
    const token = await generateToken({ sub: userId })
    await db.insert(users).values({ id: userId, email: 'user@test.com', fullName: 'Test User' })

    const app = createApp()
    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: userId,
      email: 'user@test.com',
      fullName: 'Test User',
      notificationEmailOptIn: false,
    })
  })
})

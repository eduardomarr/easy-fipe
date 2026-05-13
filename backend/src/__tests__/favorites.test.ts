import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { db } from '../db/client.js'
import { favorites, users } from '../db/schema.js'
import { createApp } from '../app.js'
import { generateToken } from './helpers.js'

async function createUser(id: string, email: string) {
  await db.insert(users).values({ id, email })
}

describe('GET /favorites', () => {
  it('returns 401 without token', async () => {
    const app = createApp()
    const res = await request(app).get('/favorites')
    expect(res.status).toBe(401)
  })

  it('returns empty array when user has no favorites', async () => {
    const userId = crypto.randomUUID()
    await createUser(userId, 'user@test.com')
    const token = await generateToken({ sub: userId })
    const app = createApp()
    const res = await request(app).get('/favorites').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns favorites ordered by created_at desc', async () => {
    const userId = crypto.randomUUID()
    await createUser(userId, 'user@test.com')
    const t1 = new Date('2025-01-01T00:00:00Z')
    const t2 = new Date('2025-01-02T00:00:00Z')
    await db.insert(favorites).values([
      { userId, fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020', createdAt: t1 },
      { userId, fipeCode: '002003-8', vehicleLabel: 'Toyota Corolla 2021', createdAt: t2 },
    ])
    const token = await generateToken({ sub: userId })
    const app = createApp()
    const res = await request(app).get('/favorites').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0]).toMatchObject({ fipeCode: '002003-8' })
  })
})

describe('POST /favorites', () => {
  it('returns 401 without token', async () => {
    const app = createApp()
    const res = await request(app).post('/favorites').send({ fipeCode: 'x', vehicleLabel: 'y' })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body', async () => {
    const userId = crypto.randomUUID()
    await createUser(userId, 'user@test.com')
    const token = await generateToken({ sub: userId })
    const app = createApp()
    const res = await request(app)
      .post('/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_body')
  })

  it('creates a favorite and returns 201', async () => {
    const userId = crypto.randomUUID()
    await createUser(userId, 'user@test.com')
    const token = await generateToken({ sub: userId })
    const app = createApp()
    const res = await request(app)
      .post('/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020', userId })
  })

  it('returns 200 with existing row on duplicate', async () => {
    const userId = crypto.randomUUID()
    await createUser(userId, 'user@test.com')
    await db.insert(favorites).values({ userId, fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020' })
    const token = await generateToken({ sub: userId })
    const app = createApp()
    const res = await request(app)
      .post('/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ fipeCode: '001004-9' })
  })
})

describe('DELETE /favorites/:fipeCode', () => {
  it('returns 401 without token', async () => {
    const app = createApp()
    const res = await request(app).delete('/favorites/001004-9')
    expect(res.status).toBe(401)
  })

  it('returns 404 when favorite does not exist', async () => {
    const userId = crypto.randomUUID()
    await createUser(userId, 'user@test.com')
    const token = await generateToken({ sub: userId })
    const app = createApp()
    const res = await request(app)
      .delete('/favorites/nonexistent')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('favorite_not_found')
  })

  it('deletes a favorite and returns 204', async () => {
    const userId = crypto.randomUUID()
    await createUser(userId, 'user@test.com')
    await db.insert(favorites).values({ userId, fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020' })
    const token = await generateToken({ sub: userId })
    const app = createApp()
    const res = await request(app)
      .delete('/favorites/001004-9')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)
    const remaining = await db.select().from(favorites)
    expect(remaining).toHaveLength(0)
  })
})

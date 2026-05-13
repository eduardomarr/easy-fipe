import request from 'supertest'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { db } from '../db/client.js'
import { favorites, notificationLogs, priceSnapshots, users } from '../db/schema.js'
import { createApp } from '../app.js'

vi.mock('../lib/fipeClient.js', () => ({
  fetchCurrentPrice: vi.fn(),
}))

vi.mock('../lib/resend.js', () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({ id: 'mock-id' }) } },
}))

const { fetchCurrentPrice } = await import('../lib/fipeClient.js')
const { resend } = await import('../lib/resend.js')

const WORKER_SECRET = process.env['WORKER_SECRET'] ?? 'dev-worker-secret'

afterEach(() => {
  vi.clearAllMocks()
})

describe('POST /worker/check-prices', () => {
  it('returns 401 when secret is missing', async () => {
    const app = createApp()
    const res = await request(app).post('/worker/check-prices')
    expect(res.status).toBe(401)
  })

  it('returns 401 when secret is wrong', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/worker/check-prices')
      .set('Authorization', 'Bearer wrong-secret')
    expect(res.status).toBe(401)
  })

  it('returns { checked: 0, notified: 0 } when no favorites exist', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/worker/check-prices')
      .set('Authorization', `Bearer ${WORKER_SECRET}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ checked: 0, notified: 0 })
  })

  it('upserts snapshot and skips notification when no prior snapshot exists', async () => {
    const userId = crypto.randomUUID()
    await db.insert(users).values({ id: userId, email: 'user@test.com', notificationEmailOptIn: true })
    await db.insert(favorites).values({ userId, fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020' })

    vi.mocked(fetchCurrentPrice).mockResolvedValue({
      priceBrl: 10000000,
      referenceMonth: 'março de 2025',
    })

    const app = createApp()
    const res = await request(app)
      .post('/worker/check-prices')
      .set('Authorization', `Bearer ${WORKER_SECRET}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ checked: 1, notified: 0 })
    expect(resend.emails.send).not.toHaveBeenCalled()

    const [snap] = await db.select().from(priceSnapshots)
    expect(snap).toMatchObject({ fipeCode: '001004-9', referenceMonth: 'março de 2025' })
  })

  it('sends email and logs notification when reference month changes', async () => {
    const userId = crypto.randomUUID()
    await db.insert(users).values({ id: userId, email: 'user@test.com', notificationEmailOptIn: true })
    await db.insert(favorites).values({ userId, fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020' })
    await db.insert(priceSnapshots).values({
      fipeCode: '001004-9',
      priceBrl: 9500000,
      referenceMonth: 'fevereiro de 2025',
    })

    vi.mocked(fetchCurrentPrice).mockResolvedValue({
      priceBrl: 10000000,
      referenceMonth: 'março de 2025',
    })

    const app = createApp()
    const res = await request(app)
      .post('/worker/check-prices')
      .set('Authorization', `Bearer ${WORKER_SECRET}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ checked: 1, notified: 1 })
    expect(resend.emails.send).toHaveBeenCalledOnce()

    const [log] = await db.select().from(notificationLogs)
    expect(log).toMatchObject({
      userId,
      fipeCode: '001004-9',
      referenceMonth: 'março de 2025',
      oldPriceBrl: 9500000,
      newPriceBrl: 10000000,
    })
  })

  it('skips opted-out users', async () => {
    const userId = crypto.randomUUID()
    await db.insert(users).values({ id: userId, email: 'user@test.com', notificationEmailOptIn: false })
    await db.insert(favorites).values({ userId, fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020' })
    await db.insert(priceSnapshots).values({
      fipeCode: '001004-9',
      priceBrl: 9500000,
      referenceMonth: 'fevereiro de 2025',
    })

    vi.mocked(fetchCurrentPrice).mockResolvedValue({
      priceBrl: 10000000,
      referenceMonth: 'março de 2025',
    })

    const app = createApp()
    const res = await request(app)
      .post('/worker/check-prices')
      .set('Authorization', `Bearer ${WORKER_SECRET}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ checked: 1, notified: 0 })
    expect(resend.emails.send).not.toHaveBeenCalled()
  })

  it('deduplicates: does not re-send if notification_log already exists', async () => {
    const userId = crypto.randomUUID()
    await db.insert(users).values({ id: userId, email: 'user@test.com', notificationEmailOptIn: true })
    await db.insert(favorites).values({ userId, fipeCode: '001004-9', vehicleLabel: 'Honda Civic 2020' })
    await db.insert(priceSnapshots).values({
      fipeCode: '001004-9',
      priceBrl: 9500000,
      referenceMonth: 'fevereiro de 2025',
    })
    await db.insert(notificationLogs).values({
      userId,
      fipeCode: '001004-9',
      referenceMonth: 'março de 2025',
      oldPriceBrl: 9500000,
      newPriceBrl: 10000000,
    })

    vi.mocked(fetchCurrentPrice).mockResolvedValue({
      priceBrl: 10000000,
      referenceMonth: 'março de 2025',
    })

    const app = createApp()
    const res = await request(app)
      .post('/worker/check-prices')
      .set('Authorization', `Bearer ${WORKER_SECRET}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ checked: 1, notified: 0 })
    expect(resend.emails.send).not.toHaveBeenCalled()
  })
})

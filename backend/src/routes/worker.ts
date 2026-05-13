import { and, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db/client.js'
import { favorites, notificationLogs, priceSnapshots, users } from '../db/schema.js'
import { buildPriceAlertEmail } from '../emails/priceAlert.js'
import { env } from '../env.js'
import { fetchCurrentPrice } from '../lib/fipeClient.js'
import { resend } from '../lib/resend.js'

export const workerRouter = Router()

workerRouter.post('/check-prices', async (req, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ') || header.slice('Bearer '.length) !== env.WORKER_SECRET) {
    res.status(401).json({ error: 'invalid_secret' })
    return
  }

  const allFavorites = await db.select({ fipeCode: favorites.fipeCode }).from(favorites)
  const distinctCodes = [...new Set(allFavorites.map((f) => f.fipeCode))]

  let checked = 0
  let notified = 0

  for (const fipeCode of distinctCodes) {
    checked++
    let current: { priceBrl: number; referenceMonth: string }
    try {
      current = await fetchCurrentPrice(fipeCode)
    } catch {
      continue
    }

    const [snapshot] = await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.fipeCode, fipeCode))
      .limit(1)

    const priceChanged = !snapshot || snapshot.referenceMonth !== current.referenceMonth

    if (priceChanged && snapshot) {
      const watchingUsers = await db
        .select({ userId: favorites.userId, vehicleLabel: favorites.vehicleLabel, email: users.email })
        .from(favorites)
        .innerJoin(users, eq(favorites.userId, users.id))
        .where(
          and(
            eq(favorites.fipeCode, fipeCode),
            eq(users.notificationEmailOptIn, true),
          ),
        )

      for (const watcher of watchingUsers) {
        const [alreadySent] = await db
          .select()
          .from(notificationLogs)
          .where(
            and(
              eq(notificationLogs.userId, watcher.userId),
              eq(notificationLogs.fipeCode, fipeCode),
              eq(notificationLogs.referenceMonth, current.referenceMonth),
            ),
          )
          .limit(1)

        if (alreadySent) continue

        const email = buildPriceAlertEmail({
          vehicleLabel: watcher.vehicleLabel,
          oldPrice: snapshot.priceBrl,
          newPrice: current.priceBrl,
          referenceMonth: current.referenceMonth,
        })

        await resend.emails.send({
          from: 'alertas@fipefacil.com',
          to: watcher.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
        })

        await db.insert(notificationLogs).values({
          userId: watcher.userId,
          fipeCode,
          referenceMonth: current.referenceMonth,
          oldPriceBrl: snapshot.priceBrl,
          newPriceBrl: current.priceBrl,
        })

        notified++
      }
    }

    await db
      .insert(priceSnapshots)
      .values({ fipeCode, priceBrl: current.priceBrl, referenceMonth: current.referenceMonth })
      .onConflictDoUpdate({
        target: priceSnapshots.fipeCode,
        set: {
          priceBrl: current.priceBrl,
          referenceMonth: current.referenceMonth,
          checkedAt: new Date(),
        },
      })
  }

  res.json({ checked, notified })
})

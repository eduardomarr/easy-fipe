import { sql } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const priceSnapshots = pgTable('price_snapshots', {
  fipeCode: text('fipe_code').primaryKey(),
  priceBrl: integer('price_brl').notNull(),
  referenceMonth: text('reference_month').notNull(),
  checkedAt: timestamp('checked_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export type PriceSnapshot = typeof priceSnapshots.$inferSelect

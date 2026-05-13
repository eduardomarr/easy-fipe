import { sql } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const notificationLogs = pgTable(
  'notification_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    fipeCode: text('fipe_code').notNull(),
    referenceMonth: text('reference_month').notNull(),
    oldPriceBrl: integer('old_price_brl').notNull(),
    newPriceBrl: integer('new_price_brl').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [unique().on(t.userId, t.fipeCode, t.referenceMonth)],
)

export type NotificationLog = typeof notificationLogs.$inferSelect

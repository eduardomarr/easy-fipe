import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    fipeCode: text('fipe_code').notNull(),
    vehicleLabel: text('vehicle_label').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [unique().on(t.userId, t.fipeCode)],
)

export type Favorite = typeof favorites.$inferSelect
export type NewFavorite = typeof favorites.$inferInsert

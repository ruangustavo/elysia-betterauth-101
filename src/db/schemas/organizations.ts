import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata'),
})

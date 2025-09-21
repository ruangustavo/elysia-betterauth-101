import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { organizations } from './organizations'
import { users } from './users'

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

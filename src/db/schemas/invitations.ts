import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { organizations } from './organizations'
import { users } from './users'

export const invitations = sqliteTable('invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').default('pending').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  pathname: text('pathname').notNull().unique(),
  dateCreated: integer('date_created', { mode: 'timestamp' }).notNull(),
})

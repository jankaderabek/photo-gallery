import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  pathname: text('pathname').notNull().unique(),
  dateCreated: integer('date_created', { mode: 'timestamp' }).notNull(),
})

// Define user roles as an enum
export type UserRole = 'user' | 'admin'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().$type<UserRole>().default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

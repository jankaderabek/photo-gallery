import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  pathname: text('pathname').notNull().unique(),
  dateCreated: integer('date_created', { mode: 'timestamp' }).notNull(),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
})

// Define user roles as an enum
export type UserRole = 'user' | 'admin'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password'),
  name: text('name').notNull(),
  role: text('role').notNull().$type<UserRole>().default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  verificationToken: text('verification_token'),
  verificationTokenExpiry: integer('verification_token_expiry', { mode: 'timestamp' }),
})

// Table to track user access to private albums
export const albumAccess = sqliteTable('album_access', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  albumId: integer('album_id').notNull().references(() => albums.id),
  userId: integer('user_id').notNull().references(() => users.id),
  dateGranted: integer('date_granted', { mode: 'timestamp' }).notNull(),
})

// Table to store image information
export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  albumId: integer('album_id').notNull().references(() => albums.id),
  pathname: text('pathname').notNull().unique(),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
})

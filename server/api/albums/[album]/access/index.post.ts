import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const accessSchema = z.object({
  userId: z.number(),
})

export default defineEventHandler(async (event) => {
  // Require admin session
  const { user } = await requireUserSession(event)

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required',
    })
  }

  const albumPathname = event.context.params?.album

  if (!albumPathname) {
    throw createError({
      statusCode: 400,
      message: 'Album pathname is required',
    })
  }

  // Get album from database
  const album = await useDrizzle()
    .select()
    .from(tables.albums)
    .where(eq(tables.albums.pathname, albumPathname))
    .get()

  if (!album) {
    throw createError({
      statusCode: 404,
      message: 'Album not found',
    })
  }

  // Validate request body
  const { userId } = await readValidatedBody(event, accessSchema.parse)

  // Check if user exists
  const userExists = await useDrizzle()
    .select({ id: tables.users.id })
    .from(tables.users)
    .where(eq(tables.users.id, userId))
    .get()

  if (!userExists) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  // Check if access already exists
  const existingAccess = await useDrizzle()
    .select()
    .from(tables.albumAccess)
    .where(
      and(
        eq(tables.albumAccess.albumId, album.id),
        eq(tables.albumAccess.userId, userId),
      ),
    )
    .get()

  if (existingAccess) {
    throw createError({
      statusCode: 400,
      message: 'User already has access to this album',
    })
  }

  // Grant access
  const access = await useDrizzle()
    .insert(tables.albumAccess)
    .values({
      albumId: album.id,
      userId,
      dateGranted: new Date(),
    })
    .returning()
    .get()

  // Get user details
  const userDetails = await useDrizzle()
    .select({
      id: tables.users.id,
      email: tables.users.email,
      name: tables.users.name,
    })
    .from(tables.users)
    .where(eq(tables.users.id, userId))
    .get()

  return {
    success: true,
    access: {
      id: access.id,
      albumId: access.albumId,
      userId: access.userId,
      dateGranted: access.dateGranted,
      user: userDetails,
    },
  }
})

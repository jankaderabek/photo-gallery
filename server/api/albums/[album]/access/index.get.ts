import { eq } from 'drizzle-orm'

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

  // Get users with access to this album
  const usersWithAccess = await useDrizzle()
    .select({
      accessId: tables.albumAccess.id,
      userId: tables.albumAccess.userId,
      dateGranted: tables.albumAccess.dateGranted,
      email: tables.users.email,
      name: tables.users.name,
    })
    .from(tables.albumAccess)
    .innerJoin(tables.users, eq(tables.albumAccess.userId, tables.users.id))
    .where(eq(tables.albumAccess.albumId, album.id))
    .all()

  return {
    album: {
      id: album.pathname,
      name: album.title,
      isPublic: album.isPublic,
    },
    users: usersWithAccess,
  }
})

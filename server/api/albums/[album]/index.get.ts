import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
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

  // Check access permissions
  // If album is public, allow access
  if (album.isPublic) {
    return {
      id: album.pathname,
      name: album.title,
      path: `albums/${album.pathname}`,
      dateCreated: album.dateCreated,
      isPublic: album.isPublic,
    }
  }

  // For private albums, check user access
  try {
    // Try to get user session
    const session = await getUserSession(event)
    const userId = session?.user?.id
    const isAdmin = session?.user?.role === 'admin'

    // Admins can access all albums
    if (isAdmin) {
      return {
        id: album.pathname,
        name: album.title,
        path: `albums/${album.pathname}`,
        dateCreated: album.dateCreated,
        isPublic: album.isPublic,
      }
    }

    // If not admin, check if user has access to this album
    if (userId) {
      const userAccess = await useDrizzle()
        .select()
        .from(tables.albumAccess)
        .where(
          and(
            eq(tables.albumAccess.albumId, album.id),
            eq(tables.albumAccess.userId, userId),
          ),
        )
        .get()

      if (userAccess) {
        return {
          id: album.pathname,
          name: album.title,
          path: `albums/${album.pathname}`,
          dateCreated: album.dateCreated,
          isPublic: album.isPublic,
        }
      }
    }

    // If we get here, user doesn't have access
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to access this album',
    })
  }
  catch (error) {
    // If there's an error getting the session or the user is not authenticated
    if (error.statusCode === 401 || !error.statusCode) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required to access this private album',
      })
    }
    throw error
  }
})

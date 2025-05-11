import { eq, or, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Try to get user session (will be undefined for unauthenticated users)
    const session = await getUserSession(event)
    const userId = session?.user?.id
    const isAdmin = session?.user?.role === 'admin'

    // Build query based on user access
    let query = useDrizzle().select().from(tables.albums)

    // If user is not authenticated, only show public albums
    if (!userId) {
      query = query.where(eq(tables.albums.isPublic, true))
    }
    // If user is authenticated but not admin, show public albums and private albums they have access to
    else if (!isAdmin) {
      // Get albums the user has access to
      const userAccessAlbums = await useDrizzle()
        .select({ albumId: tables.albumAccess.albumId })
        .from(tables.albumAccess)
        .where(eq(tables.albumAccess.userId, userId))
        .all()

      const accessibleAlbumIds = userAccessAlbums.map(access => access.albumId)

      if (accessibleAlbumIds.length > 0) {
        // Show public albums OR albums the user has access to
        query = query.where(
          or(
            eq(tables.albums.isPublic, true),
            // Use in() when there are albums the user has access to
            accessibleAlbumIds.length > 0
              ? inArray(tables.albums.id, accessibleAlbumIds)
              : undefined,
          ),
        )
      }
      else {
        // If user doesn't have access to any private albums, just show public ones
        query = query.where(eq(tables.albums.isPublic, true))
      }
    }
    // Admins can see all albums, so no filter needed

    // Execute the query
    const dbAlbums = await query.all()

    // Map database albums to the expected format
    return dbAlbums.map((album) => {
      return {
        id: album.pathname,
        name: album.title,
        path: `albums/${album.pathname}`,
        dateCreated: album.dateCreated,
        isPublic: album.isPublic,
      }
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_) {
    // If there's an error getting the session (like no session exists),
    // just return public albums
    const dbAlbums = await useDrizzle()
      .select()
      .from(tables.albums)
      .where(eq(tables.albums.isPublic, true))
      .all()

    return dbAlbums.map((album) => {
      return {
        id: album.pathname,
        name: album.title,
        path: `albums/${album.pathname}`,
        dateCreated: album.dateCreated,
        isPublic: album.isPublic,
      }
    })
  }
})

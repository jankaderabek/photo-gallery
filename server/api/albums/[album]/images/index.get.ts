import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const albumPathname = event.context.params?.album

  if (!albumPathname) {
    throw createError({
      statusCode: 400,
      message: 'Album pathname is required',
    })
  }

  // Check if album exists in database
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
    // Proceed with fetching images
    const result = await hubBlob().list({
      prefix: `albums/${albumPathname}/`,
      folded: false,
    })

    return (result.blobs || [])
      .filter(blob =>
        !blob.pathname.includes('/previews/')
        && !blob.pathname.endsWith('.placeholder'),
      )
      .map((blob) => {
        const filename = blob.pathname.split('/').pop() || ''

        return {
          id: blob.pathname,
          url: `${blob.pathname}`,
          previewUrl: `/images/albums/${albumPathname}/previews/${filename}`,
          uploadedAt: blob.uploadedAt,
        }
      })
  }

  // For private albums, check user access
  try {
    // Try to get user session
    const session = await getUserSession(event)
    const userId = session?.user?.id
    const isAdmin = session?.user?.role === 'admin'

    // Admins can access all albums
    if (isAdmin) {
      // Proceed with fetching images
      const result = await hubBlob().list({
        prefix: `albums/${albumPathname}/`,
        folded: false,
      })

      return (result.blobs || [])
        .filter(blob =>
          !blob.pathname.includes('/previews/')
          && !blob.pathname.endsWith('.placeholder'),
        )
        .map((blob) => {
          const filename = blob.pathname.split('/').pop() || ''

          return {
            id: blob.pathname,
            url: `${blob.pathname}`,
            previewUrl: `/images/albums/${albumPathname}/previews/${filename}`,
            uploadedAt: blob.uploadedAt,
          }
        })
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
        // User has access, proceed with fetching images
        const result = await hubBlob().list({
          prefix: `albums/${albumPathname}/`,
          folded: false,
        })

        return (result.blobs || [])
          .filter(blob =>
            !blob.pathname.includes('/previews/')
            && !blob.pathname.endsWith('.placeholder'),
          )
          .map((blob) => {
            const filename = blob.pathname.split('/').pop() || ''

            return {
              id: blob.pathname,
              url: blob.pathname,
              previewUrl: `/images/albums/${albumPathname}/previews/${filename}`,
              uploadedAt: blob.uploadedAt,
            }
          })
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

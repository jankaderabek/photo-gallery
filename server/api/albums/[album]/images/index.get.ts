import { and, eq, desc, gt, sql } from 'drizzle-orm'
import { tables, useDrizzle } from '../../../../utils/drizzle'

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

  // Get pagination parameters from query
  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 10
  const page = parseInt(query.page as string) || 1
  const offset = (page - 1) * limit

  // Check access permissions
  // If album is public, allow access
  if (album.isPublic) {
    // Get total count of images for pagination
    const totalCountResult = await useDrizzle()
      .select({ count: sql<number>`count(*)` })
      .from(tables.images)
      .where(eq(tables.images.albumId, album.id))
      .get()

    const totalCount = totalCountResult?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Proceed with fetching images from database with pagination
    const imagesQuery = useDrizzle()
      .select()
      .from(tables.images)
      .where(eq(tables.images.albumId, album.id))
      // Sort by uploadedAt and id in descending order (newest first)
      .orderBy(desc(tables.images.uploadedAt), desc(tables.images.id))
      .limit(limit)
      .offset(offset)

    const dbImages = await imagesQuery.all()

    // Check if there are more pages
    const hasMore = page < totalPages

    // Map database images to the expected format
    return {
      images: dbImages.map((image) => {
        const filename = image.filename
        return {
          id: image.pathname,
          url: image.pathname,
          previewUrl: `/images/albums/${albumPathname}/previews/${filename}`,
          uploadedAt: image.uploadedAt.toISOString(),
          imageId: image.id,
        }
      }),
      page,
      totalPages,
      totalCount,
      hasMore,
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
      // Get total count of images for pagination
      const totalCountResult = await useDrizzle()
        .select({ count: sql<number>`count(*)` })
        .from(tables.images)
        .where(eq(tables.images.albumId, album.id))
        .get()

      const totalCount = totalCountResult?.count || 0
      const totalPages = Math.ceil(totalCount / limit)

      // Proceed with fetching images from database with pagination
      const imagesQuery = useDrizzle()
        .select()
        .from(tables.images)
        .where(eq(tables.images.albumId, album.id))
        // Sort by uploadedAt and id in descending order (newest first)
        .orderBy(desc(tables.images.uploadedAt), desc(tables.images.id))
        .limit(limit)
        .offset(offset)

      const dbImages = await imagesQuery.all()

      // Check if there are more pages
      const hasMore = page < totalPages

      // Map database images to the expected format
      return {
        images: dbImages.map((image) => {
          const filename = image.filename
          return {
            id: image.pathname,
            url: image.pathname,
            previewUrl: `/images/albums/${albumPathname}/previews/${filename}`,
            uploadedAt: image.uploadedAt.toISOString(),
            photoCreatedAt: image.photoCreatedAt ? image.photoCreatedAt.toISOString() : null,
            imageId: image.id,
          }
        }),
        page,
        totalPages,
        totalCount,
        hasMore,
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
        // Get total count of images for pagination
        const totalCountResult = await useDrizzle()
          .select({ count: sql<number>`count(*)` })
          .from(tables.images)
          .where(eq(tables.images.albumId, album.id))
          .get()

        const totalCount = totalCountResult?.count || 0
        const totalPages = Math.ceil(totalCount / limit)

        // User has access, proceed with fetching images from database with pagination
        const imagesQuery = useDrizzle()
          .select()
          .from(tables.images)
          .where(eq(tables.images.albumId, album.id))
          // Sort by uploadedAt and id in descending order (newest first)
          .orderBy(desc(tables.images.uploadedAt), desc(tables.images.id))
          .limit(limit)
          .offset(offset)

        const dbImages = await imagesQuery.all()

        // Check if there are more pages
        const hasMore = page < totalPages

        // Map database images to the expected format
        return {
          images: dbImages.map((image) => {
            const filename = image.filename
            return {
              id: image.pathname,
              url: image.pathname,
              previewUrl: `/images/albums/${albumPathname}/previews/${filename}`,
              uploadedAt: image.uploadedAt.toISOString(),
              photoCreatedAt: image.photoCreatedAt ? image.photoCreatedAt.toISOString() : null,
              imageId: image.id,
            }
          }),
          page,
          totalPages,
          totalCount,
          hasMore,
        }
      }
    }

    // If we get here, user doesn't have access
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to access this album',
    })
  }
  catch (error: any) {
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

import { eq } from 'drizzle-orm'
import { tables, useDrizzle } from '../../../../server/utils/drizzle'

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

  try {
    // List all blobs in the album
    const result = await hubBlob().list({
      prefix: `albums/${albumPathname}/`,
      folded: false,
    })

    // Delete all blobs in the album
    const deletePromises = (result.blobs || []).map(blob =>
      hubBlob().delete(blob.pathname),
    )

    await Promise.allSettled(deletePromises)

    // Delete the album from the database
    await useDrizzle()
      .delete(tables.albums)
      .where(eq(tables.albums.pathname, albumPathname))
      .run()

    return {
      success: true,
      message: 'Album and all images deleted successfully',
    }
  }
  catch (error) {
    console.error('Error deleting album:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete album',
    })
  }
})

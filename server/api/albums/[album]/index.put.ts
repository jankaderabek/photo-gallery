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

  // Get request body
  const body = await readBody(event)
  const { title } = body

  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw createError({
      statusCode: 400,
      message: 'Album title is required',
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
    // Update album title in the database
    const updatedAlbum = await useDrizzle()
      .update(tables.albums)
      .set({
        title,
      })
      .where(eq(tables.albums.pathname, albumPathname))
      .returning()
      .get()

    return {
      success: true,
      album: {
        id: updatedAlbum.pathname,
        name: updatedAlbum.title,
        path: `albums/${updatedAlbum.pathname}`,
        dateCreated: updatedAlbum.dateCreated,
      },
    }
  }
  catch (error) {
    console.error('Error updating album:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update album',
    })
  }
})

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
  const { title, isPublic } = body

  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw createError({
      statusCode: 400,
      message: 'Album title is required',
    })
  }

  // isPublic is optional, but if provided must be a boolean
  if (isPublic !== undefined && typeof isPublic !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'isPublic must be a boolean',
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
    // Update album in the database
    const updateData: { title: string, isPublic?: boolean } = { title }

    // Only include isPublic in the update if it was provided
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic
    }
    const updatedAlbum = await useDrizzle()
      .update(tables.albums)
      .set(updateData)
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
        isPublic: updatedAlbum.isPublic,
      },
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_) {
    throw createError({
      statusCode: 500,
      message: 'Failed to update album',
    })
  }
})

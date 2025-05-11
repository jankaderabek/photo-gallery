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
  const accessId = event.context.params?.id

  if (!albumPathname || !accessId) {
    throw createError({
      statusCode: 400,
      message: 'Album pathname and access ID are required',
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

  // Check if access exists
  const access = await useDrizzle()
    .select()
    .from(tables.albumAccess)
    .where(eq(tables.albumAccess.id, parseInt(accessId)))
    .get()

  if (!access) {
    throw createError({
      statusCode: 404,
      message: 'Access not found',
    })
  }

  // Check if access belongs to this album
  if (access.albumId !== album.id) {
    throw createError({
      statusCode: 400,
      message: 'Access does not belong to this album',
    })
  }

  // Delete access
  await useDrizzle()
    .delete(tables.albumAccess)
    .where(eq(tables.albumAccess.id, parseInt(accessId)))
    .run()

  return {
    success: true,
    message: 'Access removed successfully',
  }
})

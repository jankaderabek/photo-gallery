export default defineEventHandler(async (event) => {
  // Require admin session
  const { user } = await requireUserSession(event)

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required',
    })
  }

  const body = await readBody(event)
  const albumName = body.name
  const isPublic = body.isPublic !== undefined ? !!body.isPublic : true // Default to true if not provided

  if (!albumName) {
    throw createError({
      statusCode: 400,
      message: 'Album name is required',
    })
  }

  const now = new Date()

  // Sanitize the album name for use as pathname
  // Replace spaces with hyphens and remove special characters
  const sanitizedPathname = albumName
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading and trailing hyphens

  // Create a placeholder file in the blob storage
  await hubBlob().put('.placeholder', new Uint8Array([]), {
    prefix: `albums/${sanitizedPathname}`,
  })

  // Create album in the database
  const album = await useDrizzle()
    .insert(tables.albums)
    .values({
      title: albumName,
      pathname: sanitizedPathname,
      dateCreated: now,
      isPublic,
    })
    .returning()
    .get()

  return {
    success: true,
    id: sanitizedPathname,
    name: albumName,
    isPublic,
    album,
  }
})

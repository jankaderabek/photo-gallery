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
        url: `/images/${blob.pathname}`,
        previewUrl: `/images/albums/${albumPathname}/previews/${filename}`,
        uploadedAt: blob.uploadedAt,
      }
    })
})

export default defineEventHandler(async (event) => {
    const albumPathname = event.context.params?.album

    if (!albumPathname) {
        throw createError({
            statusCode: 400,
            message: 'Album pathname is required'
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
            message: 'Album not found'
        })
    }

    return {
        id: album.pathname,
        name: album.title,
        path: `albums/${album.pathname}`,
        dateCreated: album.dateCreated
    }
})

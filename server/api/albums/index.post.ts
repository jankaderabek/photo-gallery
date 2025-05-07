export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const albumName = body.name;

    if (!albumName) {
        throw createError({
            statusCode: 400,
            message: 'Album name is required'
        })
    }

    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .split('.')[0] + '_';

    const prefixedAlbumName = timestamp + decodeURIComponent(albumName)

    await hubBlob().put('.placeholder', new Uint8Array([]), {
        prefix: `albums/${prefixedAlbumName}`
    })

    return {
        success: true,
        name: prefixedAlbumName
    }
})

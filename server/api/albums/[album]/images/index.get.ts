export default defineEventHandler(async (event) => {
    const album = event.context.params?.album

    if (!album) {
        throw createError({
            statusCode: 400,
            message: 'Album name is required'
        })
    }

    console.log('Fetching images for album', album)

    const result = await hubBlob().list({
        prefix: `albums/${decodeURIComponent(album)}/`,
        folded: false
    })

    return (result.blobs || [])
        .filter(blob =>
            !blob.pathname.includes('/previews/') &&
            !blob.pathname.endsWith('.placeholder')
        )
        .map(blob => {
            const filename = blob.pathname.split('/').pop() || ''

            return {
                id: blob.pathname,
                url: `/images/${blob.pathname}`,
                previewUrl: `/images/albums/${decodeURIComponent(album)}/previews/${filename}`,
                uploadedAt: blob.uploadedAt
            }
        })
})

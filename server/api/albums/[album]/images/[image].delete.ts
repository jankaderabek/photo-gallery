import { eq } from 'drizzle-orm'
import { tables, useDrizzle } from '../../../../../server/utils/drizzle'

export default defineEventHandler(async (event) => {
    // Require admin session
    const { user } = await requireUserSession(event)

    if (user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            message: 'Forbidden: Admin access required'
        })
    }

    const albumPathname = event.context.params?.album
    const imagePath = event.context.params?.image

    if (!albumPathname || !imagePath) {
        throw createError({
            statusCode: 400,
            message: 'Album pathname and image path are required'
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
            message: 'Album not found'
        })
    }

    try {
        // Delete the main image
        await hubBlob().delete(decodeURIComponent(imagePath))

        // Also delete the preview image if it exists
        const filename = imagePath.split('/').pop() || ''
        const previewPath = `albums/${albumPathname}/previews/${filename}`

        try {
            await hubBlob().delete(previewPath)
        } catch (error) {
            console.warn(`Could not delete preview image: ${previewPath}`, error)
            // Continue even if preview deletion fails
        }

        return {
            success: true,
            message: 'Image deleted successfully'
        }
    } catch (error) {
        console.error('Error deleting image:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to delete image'
        })
    }
})

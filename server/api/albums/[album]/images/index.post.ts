export default defineEventHandler(async (event) => {
    const albumPathname = event.context.params?.album

    if (!albumPathname) {
        throw createError({
            statusCode: 400,
            message: 'Album pathname is required'
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

    const form = await readFormData(event)
    const imagesPrefix = `albums/${albumPathname.replace('/', '')}`
    const previewsPrefix = `${imagesPrefix}/previews`
    const files = form.getAll("files") as File[]

    if (files.length === 0) {
        throw createError({ statusCode: 400, message: 'No files provided' })
    }

    const env = event.context.cloudflare?.env || {}
    const results = []

    for (const file of files) {
        try {
            ensureBlob(file, {
                maxSize: '32MB',
                types: ['image']
            })

            let arrayBuffer = await file.arrayBuffer();
            let imageType = "image/webp";

            // Generate timestamp prefix for sorting (YYYYMMDD_HHMMSS_)
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/[-:]/g, '')
                .replace('T', '_')
                .split('.')[0] + '_';

            // Create timestamped filename
            const originalName = file.name;
            const timestampedName = timestamp + originalName;

            let fullSizeImageBuffer = arrayBuffer;
            let previewSizeImageBuffer = arrayBuffer;

            if (env.IMAGES) {
            // Process full-size image
                const fullSizeImageResponse = await (
                    await env.IMAGES.input(arrayBuffer)
                        .transform({ width: 1920 })
                        .output({ format: imageType })
                ).response() as Response;

                fullSizeImageBuffer = await fullSizeImageResponse.arrayBuffer();

                // Process preview image
                const previewSizeImageResponse = await (
                    await env.IMAGES.input(fullSizeImageBuffer)
                        .transform({ width: 300 })
                        .output({ format: imageType })
                ).response() as Response;

                previewSizeImageBuffer = await previewSizeImageResponse.arrayBuffer();
            }

            // Save preview image with timestamped name
            await hubBlob().put(timestampedName, previewSizeImageBuffer, {
                addRandomSuffix: false,
                prefix: previewsPrefix,
                contentType: imageType
            })

            // Save full-size image with timestamped name
            const result = await hubBlob().put(timestampedName, fullSizeImageBuffer, {
                addRandomSuffix: false,
                prefix: imagesPrefix,
                contentType: imageType
            })

            results.push({
                filename: originalName,
                timestampedName: timestampedName,
                success: true,
                path: `${imagesPrefix}/${timestampedName}`,
                result
            })
        } catch (error) {
            console.error(`Error processing file ${file.name}:`, error)
            results.push({
                filename: file.name,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }

    return results
})

export default defineEventHandler(async (event) => {
    const albumId = event.context.params?.album

    if (!albumId) {
        throw createError({
            statusCode: 400,
            message: 'Album ID is required'
        })
    }

    const form = await readFormData(event)
    const imagesPrefix = `albums/${albumId.replace('/', '')}`
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

            // Process full-size image
            const fullSizeImageResponse = await (
                await env.IMAGES.input(arrayBuffer)
                    .transform({ width: 1920 })
                    .output({ format: imageType })
            ).response() as Response;

            const resizedImageBuffer = await fullSizeImageResponse.arrayBuffer();

            // Process preview image
            const previewSizeImageResponse = await (
                await env.IMAGES.input(resizedImageBuffer)
                    .transform({ width: 300 })
                    .output({ format: imageType })
            ).response() as Response;

            // Save preview image with timestamped name
            await hubBlob().put(timestampedName, await previewSizeImageResponse.arrayBuffer(), {
                addRandomSuffix: false,
                prefix: previewsPrefix,
                contentType: imageType
            })

            // Save full-size image with timestamped name
            const result = await hubBlob().put(timestampedName, resizedImageBuffer, {
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

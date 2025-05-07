export default defineEventHandler(async (event) => {
    const form = await readFormData(event)
    const file = form.get('files') as File

    if (!file || !file.size) {
        console.log(file)
        throw createError({ statusCode: 400, message: 'No file provided' })
    }

    ensureBlob(file, {
        maxSize: '32MB',
        types: ['image']
    })

    let arrayBuffer = await file.arrayBuffer();
    const env = event.context.cloudflare?.env || {}

    let imageType = "image/webp";
    const fullSizeImageResponse = await (
        await env.IMAGES.input(arrayBuffer)
            .transform({ width: 1920 })
            .output({ format: imageType })
    ).response() as Response;

    const resizedImageBuffer = await fullSizeImageResponse.arrayBuffer();


    const previewSizeImageResponse = await (
        await env.IMAGES.input(resizedImageBuffer)
            .transform({ width: 300 })
            .output({ format: imageType })
    ).response() as Response;

    await hubBlob().put(file.name, await previewSizeImageResponse.arrayBuffer(), {
        addRandomSuffix: false,
        prefix: 'images/previews',
        contentType: imageType
    })

    return hubBlob().put(file.name, resizedImageBuffer, {
        addRandomSuffix: false,
        prefix: 'images',
        contentType: imageType
    })
})

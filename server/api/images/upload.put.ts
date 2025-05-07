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

    const response = (
        await env.IMAGES.input(arrayBuffer)
            .transform({ rotate: 90 })
            .transform({ width: 128 })
            .transform({ blur: 20 })
            .output({ format: "image/avif" })
    ).response();

    return hubBlob().put(file.name, response, {
        addRandomSuffix: false,
        prefix: 'images'
    })
})

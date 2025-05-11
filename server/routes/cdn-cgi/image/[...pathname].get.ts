export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  const env = event.context.cloudflare?.env || {}
  const cloudflareImagesParametersString = pathname.split('/')[0]
  const cloudflareImagesParameters = cloudflareImagesParametersString
    .split(',')
    .reduce((acc, param) => {
      const [key, value] = param.split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
  const imagePath = pathname.slice(cloudflareImagesParametersString.length + 1)
  const originalImage = await hubBlob().get(imagePath)

  if (!originalImage) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  if (env.IMAGES) {
    const imageResponse = await (
      await env.IMAGES.input(originalImage)
        .transform(cloudflareImagesParameters)
        .output({ format: 'image/webp' })
    ).response() as Response

    return imageResponse
  }

  return originalImage
})

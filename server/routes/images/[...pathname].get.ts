export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  if (!pathname) {
    throw createError({
      statusCode: 400,
      message: 'Pathname is required',
    })
  }

  setHeader(event, 'Content-Security-Policy', 'default-src \'none\';')
  return hubBlob().serve(event, decodeURIComponent(pathname))
})

export default defineEventHandler(async (event) => {
  // Skip authentication for auth routes
  if (
    event.path === '/api/auth/login'
    || event.path === '/api/auth/logout'
    || event.path === '/api/auth/request-code'
    || event.path === '/api/auth/verify-code'
    || event.path === '/api/auth/verify'
  ) {
    return
  }

  // Check if the route requires admin access
  if (event.path.startsWith('/api/admin/')) {
    try {
      const { user } = await requireUserSession(event)

      if (user.role !== 'admin') {
        throw createError({
          statusCode: 403,
          message: 'Forbidden: Admin access required',
        })
      }
    }
    catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
        throw createError({
          statusCode: 401,
          message: 'Unauthorized: Authentication required',
        })
      }
      throw error
    }
  }
})

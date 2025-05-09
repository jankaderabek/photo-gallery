export default defineEventHandler(async (event) => {
  // Skip authentication for login and register routes
  if (event.path.startsWith('/api/auth/')) {
    return
  }

  // Check if the route requires admin access
  if (event.path.startsWith('/api/admin/')) {
    try {
      const { user } = await requireUserSession(event)
      
      if (user.role !== 'admin') {
        throw createError({
          statusCode: 403,
          message: 'Forbidden: Admin access required'
        })
      }
    } catch (error: any) {
      if (error.statusCode === 401) {
        throw createError({
          statusCode: 401,
          message: 'Unauthorized: Authentication required'
        })
      }
      throw error
    }
  }
})

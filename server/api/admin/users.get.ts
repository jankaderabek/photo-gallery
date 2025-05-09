export default defineEventHandler(async (event) => {
  // Require a user session and check if the user is an admin
  const { user } = await requireUserSession(event)

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required',
    })
  }

  // Get all users
  const users = await useDrizzle()
    .select({
      id: tables.users.id,
      email: tables.users.email,
      name: tables.users.name,
      role: tables.users.role,
      createdAt: tables.users.createdAt,
    })
    .from(tables.users)
    .all()

  return users
})

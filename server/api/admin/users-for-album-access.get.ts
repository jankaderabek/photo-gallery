import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require admin session
  const { user } = await requireUserSession(event)

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required',
    })
  }

  // Get all users with role 'user' (not admins)
  const regularUsers = await useDrizzle()
    .select({
      id: tables.users.id,
      email: tables.users.email,
      name: tables.users.name,
    })
    .from(tables.users)
    .where(eq(tables.users.role, 'user'))
    .all()

  // If there are no regular users, return all users (including admins)
  if (regularUsers.length === 0) {
    const allUsers = await useDrizzle()
      .select({
        id: tables.users.id,
        email: tables.users.email,
        name: tables.users.name,
      })
      .from(tables.users)
      .all()

    // Filter out the current user (don't allow self-assignment)
    const filteredUsers = allUsers.filter(u => u.id !== user.id)

    return filteredUsers
  }
  return regularUsers
})

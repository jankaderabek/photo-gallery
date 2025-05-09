import { z } from 'zod'
import type { UserRole } from '../../database/schema'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['user', 'admin']).default('user')
})

export default defineEventHandler(async (event) => {
  // Require a user session and check if the user is an admin
  const { user } = await requireUserSession(event)

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    })
  }

  // Validate the request body
  const { email, password, name, role } = await readValidatedBody(event, createUserSchema.parse)

  // Check if the user already exists
  const existingUser = await useDrizzle()
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, email))
    .get()

  if (existingUser) {
    throw createError({
      statusCode: 400,
      message: 'User with this email already exists'
    })
  }

  // Hash the password using built-in utility
  const hashedPassword = await hashPassword(password)

  // Create the user
  const newUser = await useDrizzle()
    .insert(tables.users)
    .values({
      email,
      password: hashedPassword,
      name,
      role: role as UserRole,
      createdAt: new Date()
    })
    .returning()
    .get()

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    createdAt: newUser.createdAt
  }
})

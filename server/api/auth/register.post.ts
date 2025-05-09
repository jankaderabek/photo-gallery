import { z } from 'zod'
import type { UserRole } from '../../database/schema'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['user', 'admin']).optional()
})

export default defineEventHandler(async (event) => {
  // Validate the request body
  const { email, password, name, role = 'user' } = await readValidatedBody(event, registerSchema.parse)

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
  const user = await useDrizzle()
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

  // Set the user session
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    loggedInAt: Date.now()
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }
})

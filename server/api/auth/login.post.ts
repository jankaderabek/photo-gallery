import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export default defineEventHandler(async (event) => {
  // Validate the request body
  const { email, password } = await readValidatedBody(event, loginSchema.parse)

  // Find the user
  const user = await useDrizzle()
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, email))
    .get()

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

  // Verify the password using built-in utility
  const isPasswordValid = await verifyPassword(user.password, password)
  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

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

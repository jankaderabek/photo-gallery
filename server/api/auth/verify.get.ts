import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { tables, useDrizzle } from '../../utils/drizzle'
import { isVerificationTokenExpired } from '../../utils/verification'

const verifyQuerySchema = z.object({
  email: z.string().email(),
  token: z.string(),
})

export default defineEventHandler(async (event) => {
  // Get query parameters
  const query = getQuery(event)

  try {
    // Validate the query parameters
    const { email, token } = verifyQuerySchema.parse(query)

    // Find the user
    const user = await useDrizzle()
      .select()
      .from(tables.users)
      .where(eq(tables.users.email, email))
      .get()

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or verification token',
      })
    }

    // Check if the verification token is valid
    if (user.verificationToken !== token) {
      throw createError({
        statusCode: 401,
        message: 'Invalid verification token',
      })
    }

    // Check if the verification token is expired
    if (isVerificationTokenExpired(user.verificationTokenExpiry)) {
      throw createError({
        statusCode: 401,
        message: 'Verification token has expired',
      })
    }

    // Clear the verification token
    await useDrizzle()
      .update(tables.users)
      .set({
        verificationToken: null,
        verificationTokenExpiry: null,
      })
      .where(eq(tables.users.id, user.id))
      .run()

    // Set the user session
    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      loggedInAt: Date.now(),
    })

    // Redirect to the home page with success message
    return sendRedirect(event, '/?login_success=true')
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (error) {
    // Get the email from the query parameters if available
    const email = query.email ? `&email=${encodeURIComponent(query.email as string)}` : ''

    // Redirect to login page with error and email
    return sendRedirect(event, `/auth/login?error=invalid_verification${email}`)
  }
})

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { tables, useDrizzle } from '../../utils/drizzle'
import { generateVerificationToken, getVerificationTokenExpiry } from '../../utils/verification'
import { getVerificationEmailTemplate } from '../../utils/email-templates'

const requestCodeSchema = z.object({
  email: z.string().email(),
})

export default defineEventHandler(async (event) => {
  // Validate the request body
  const { email } = await readValidatedBody(event, requestCodeSchema.parse)

  // Find the user
  const user = await useDrizzle()
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, email))
    .get()

  // Check if user exists
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  // Generate a secure verification token
  const verificationToken = generateVerificationToken()
  const verificationTokenExpiry = getVerificationTokenExpiry()

  // Update the existing user with the verification token
  await useDrizzle()
    .update(tables.users)
    .set({
      verificationToken,
      verificationTokenExpiry,
    })
    .where(eq(tables.users.id, user.id))
    .run()

  // Send the verification email
  try {
    // Send the verification email with Resend
    const config = useRuntimeConfig()
    const { error } = await useResend().emails.send({
      from: config.resend.defaultFrom || 'Photo Gallery <noreply@example.com>',
      to: email,
      subject: 'Your Photo Gallery Login Link',
      html: getVerificationEmailTemplate(verificationToken, email, user?.name),
    })

    if (error) {
      console.error('Failed to send verification email:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to send verification email',
      })
    }

    // Return success response
    return {
      success: true,
      message: 'Login link sent to your email',
    }
  }
  catch (error) {
    console.error('Error sending verification email:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to send verification email',
    })
  }
})

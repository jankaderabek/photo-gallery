/**
 * Email templates for the application
 */

/**
 * Generate the verification email template with secure login link
 * @param token The verification token
 * @param email The user's email
 * @param name The user's name (optional)
 * @returns The HTML email template
 */
export function getVerificationEmailTemplate(token: string, email: string, name?: string): string {
  const greeting = name ? `Hello ${name},` : 'Hello,'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Photo Gallery Login Link</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 30px 0;
    }
    .footer {
      font-size: 12px;
      color: #777;
      margin-top: 40px;
      text-align: center;
    }
  </style>
</head>
<body>
  <p>${greeting}</p>
  <p>You requested to log in to Photo Gallery. Click the button below to securely sign in:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.NODE_ENV === 'production' ? 'https://gallery.jankaderabek.eu' : 'http://localhost:3000'}/api/auth/verify?email=${encodeURIComponent(email)}&token=${token}" class="button">Secure Login</a>
  </div>

  <p>This secure login link will expire in 15 minutes. If you didn't request this login, you can safely ignore this email.</p>

  <p>Thank you,<br>Photo Gallery Team</p>

  <div class="footer">
    This is an automated message, please do not reply to this email.
  </div>
</body>
</html>
  `
}

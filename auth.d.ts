import type { UserRole } from './server/database/schema'

declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    name: string
    role: UserRole
  }

  interface UserSession {
    loggedInAt: number
  }

  interface SecureSessionData {
    // Add secure data that should only be accessible on the server
    userId?: number // Example property to satisfy the linter
  }
}

export {}

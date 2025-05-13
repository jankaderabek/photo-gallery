/**
 * Utility functions for email verification
 */
import { getRandomValues } from 'uncrypto'

/**
 * Generate a secure random verification token
 * @returns A secure random token string
 */
export function generateVerificationToken(): string {
  // Generate a secure random token (32 bytes = 64 hex characters)
  const buffer = new Uint8Array(32)
  getRandomValues(buffer)
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Check if a verification token is expired
 * @param expiryTimestamp The expiry timestamp
 * @returns True if the token is expired, false otherwise
 */
export function isVerificationTokenExpired(expiryTimestamp: Date | null): boolean {
  if (!expiryTimestamp) return true
  return new Date() > expiryTimestamp
}

/**
 * Get the expiry timestamp for a verification token
 * @param minutes The number of minutes until expiry (default: 15)
 * @returns The expiry timestamp
 */
export function getVerificationTokenExpiry(minutes = 15): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + minutes)
  return expiry
}

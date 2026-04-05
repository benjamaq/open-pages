import { randomBytes } from 'crypto'

/** URL-safe single-use claim token (32+ chars). */
export function generateCohortRewardClaimToken(): string {
  return randomBytes(24).toString('base64url')
}

/**
 * B2C capacity / waitlist gate (individual signups), not cohorts.
 *
 * Prefer `NEXT_PUBLIC_B2C_AT_CAPACITY` so the value is available in client bundles.
 * Also respects `B2C_AT_CAPACITY` when the flag is computed on the server (see root layout).
 *
 * Vercel Production: add either variable and redeploy. Accepted truthy values (trimmed, case-insensitive):
 * `true`, `1`, `yes`, `on`.
 */

function envFlagTruthy(raw: string | undefined): boolean {
  if (raw == null || String(raw).trim() === '') return false
  const s = String(raw).trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes' || s === 'on'
}

/** Server + build-time: checks public and private env names. */
export function readB2cAtCapacityFromProcessEnv(
  env: typeof process.env = process.env,
): boolean {
  return (
    envFlagTruthy(env.NEXT_PUBLIC_B2C_AT_CAPACITY) ||
    envFlagTruthy(env.B2C_AT_CAPACITY)
  )
}

/**
 * Client-safe: only `NEXT_PUBLIC_*` exists in the browser bundle.
 * Prefer passing `atCapacity` from the root layout when possible.
 */
export function isB2cAtCapacityEnabled(): boolean {
  return readB2cAtCapacityFromProcessEnv()
}

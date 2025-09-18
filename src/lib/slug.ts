/**
 * Converts a display name to a URL-friendly slug
 * @param displayName - The display name to convert
 * @returns A URL-friendly slug
 */
export function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generates a random 6-digit number
 * @returns A 6-digit number as string
 */
export function generateRandomNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Generates a unique slug by combining display name with random number
 * @param displayName - The display name to convert
 * @returns A unique slug with random number
 */
export function generateUniqueSlug(displayName: string): string {
  const baseSlug = generateSlug(displayName)
  const randomNumber = generateRandomNumber()
  return `${baseSlug}-${randomNumber}`
}

/**
 * Generates a preview slug for display purposes (without checking database)
 * @param displayName - The display name to convert
 * @returns A preview slug
 */
export function generateSlugPreview(displayName: string): string {
  if (!displayName.trim()) {
    return ''
  }
  
  const baseSlug = generateSlug(displayName)
  const randomNumber = generateRandomNumber()
  return `${baseSlug}-${randomNumber}`
}

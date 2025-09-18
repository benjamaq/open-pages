import { createClient } from './supabase/server'

/**
 * Checks if a slug exists in the database (server-side)
 * @param slug - The slug to check
 * @returns Promise<boolean> - True if slug exists, false otherwise
 */
export async function checkSlugExists(slug: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('slug')
    .eq('slug', slug)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw error
  }
  
  return !!data
}

/**
 * Generates a unique slug that doesn't exist in the database (server-side)
 * @param displayName - The display name to convert
 * @returns Promise<string> - A unique slug
 */
export async function generateAvailableSlug(displayName: string): Promise<string> {
  const { generateSlug, generateRandomNumber } = await import('./slug')
  
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const baseSlug = generateSlug(displayName)
    const randomNumber = generateRandomNumber()
    const slug = `${baseSlug}-${randomNumber}`
    
    const exists = await checkSlugExists(slug)
    
    if (!exists) {
      return slug
    }
    
    attempts++
  }
  
  // If we've exhausted attempts, add timestamp to ensure uniqueness
  const baseSlug = generateSlug(displayName)
  const timestamp = Date.now().toString().slice(-6)
  return `${baseSlug}-${timestamp}`
}

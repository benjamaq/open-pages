// Minimal no-op cache stubs; replace with Redis or Supabase table if needed
const memory = new Map<string, { value: any; expires: number }>()

export async function getCachedResults(userId: string): Promise<any | null> {
  const k = `insights:${userId}`
  const hit = memory.get(k)
  if (!hit) return null
  if (Date.now() > hit.expires) {
    memory.delete(k)
    return null
  }
  return hit.value
}

export async function setCachedResults(userId: string, results: any, ttlMs: number = 24 * 60 * 60 * 1000) {
  const k = `insights:${userId}`
  memory.set(k, { value: results, expires: Date.now() + ttlMs })
}

export async function invalidateCache(userId: string) {
  const k = `insights:${userId}`
  memory.delete(k)
}



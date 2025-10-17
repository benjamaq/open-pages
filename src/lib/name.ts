export function getFirstName(name?: string | null, fallback: string = 'there'): string {
  if (!name) return fallback;
  const trimmed = String(name).trim();
  if (!trimmed) return fallback;
  const first = trimmed.split(/\s+/)[0];
  return first || fallback;
}



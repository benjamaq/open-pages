// URL validation utilities for affiliate links

export function isValidAffiliateUrl(url: string): boolean {
  if (!url || url.trim() === '') return true; // Optional field
  
  try {
    const parsed = new URL(url.trim());
    
    // Protocol check
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Block potentially problematic domains
    const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
    if (blockedDomains.some(domain => parsed.hostname.includes(domain))) {
      return false;
    }
    
    // Ensure it's not just a domain (should have a path or query)
    if (parsed.pathname === '/' && !parsed.search) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export function validateAffiliateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || url.trim() === '') {
    return { isValid: true }; // Optional field
  }
  
  const trimmed = url.trim();
  
  if (!isValidAffiliateUrl(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid URL (e.g., https://amazon.com/dp/...)'
    };
  }
  
  if (trimmed.length > 2048) {
    return {
      isValid: false,
      error: 'URL is too long (max 2048 characters)'
    };
  }
  
  return { isValid: true };
}

export function sanitizeAffiliateUrl(url: string): string {
  if (!url) return '';
  return url.trim();
}

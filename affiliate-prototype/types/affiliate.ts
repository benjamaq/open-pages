// Affiliate feature types - isolated from main app

export interface AffiliateItem {
  id: string;
  name: string;
  brand?: string | null;
  buy_link?: string | null;
  // Add other fields as needed
  category?: string;
  description?: string;
  dose?: string;
  timing?: string;
  public?: boolean;
}

export interface AffiliateFormData {
  brand: string;
  buy_link: string;
}

export interface UserPlan {
  plan: 'free' | 'pro';
  show_shop_section?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// For the full MVP (future)
export interface FullAffiliateItem {
  id: string;
  name: string;
  retailer_name?: string | null;
  affiliate_url?: string | null;
  show_affiliate: boolean;
  category?: string;
  description?: string;
}

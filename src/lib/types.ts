// Database types for Open Pages health profile sharing app

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          slug: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          public: boolean
          referral_code: string | null
          referral_source: string | null
          referred_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slug: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          public?: boolean
          referral_code?: string | null
          referral_source?: string | null
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          slug?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          public?: boolean
          referral_code?: string | null
          referral_source?: string | null
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stack_items: {
        Row: {
          id: string
          profile_id: string
          name: string
          dose: string | null
          timing: string | null
          brand: string | null
          notes: string | null
          public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          dose?: string | null
          timing?: string | null
          brand?: string | null
          notes?: string | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          dose?: string | null
          timing?: string | null
          brand?: string | null
          notes?: string | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      protocols: {
        Row: {
          id: string
          profile_id: string
          name: string
          details: string | null
          frequency: string | null
          public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          details?: string | null
          frequency?: string | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          details?: string | null
          frequency?: string | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      uploads: {
        Row: {
          id: string
          profile_id: string
          file_url: string
          title: string
          description: string | null
          public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          file_url: string
          title: string
          description?: string | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          file_url?: string
          title?: string
          description?: string | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_usage: {
        Row: {
          id: string
          user_id: string
          tier: 'free' | 'pro'
          stack_items_limit: number
          protocols_limit: number
          uploads_limit: number
          is_in_trial: boolean
          trial_started_at: string | null
          trial_ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier?: 'free' | 'pro'
          stack_items_limit?: number
          protocols_limit?: number
          uploads_limit?: number
          is_in_trial?: boolean
          trial_started_at?: string | null
          trial_ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: 'free' | 'pro'
          stack_items_limit?: number
          protocols_limit?: number
          uploads_limit?: number
          is_in_trial?: boolean
          trial_started_at?: string | null
          trial_ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type StackItem = Database['public']['Tables']['stack_items']['Row']
export type Protocol = Database['public']['Tables']['protocols']['Row']
export type Upload = Database['public']['Tables']['uploads']['Row']
export type UserUsage = Database['public']['Tables']['user_usage']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type StackItemInsert = Database['public']['Tables']['stack_items']['Insert']
export type ProtocolInsert = Database['public']['Tables']['protocols']['Insert']
export type UploadInsert = Database['public']['Tables']['uploads']['Insert']
export type UserUsageInsert = Database['public']['Tables']['user_usage']['Insert']

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type StackItemUpdate = Database['public']['Tables']['stack_items']['Update']
export type ProtocolUpdate = Database['public']['Tables']['protocols']['Update']
export type UploadUpdate = Database['public']['Tables']['uploads']['Update']
export type UserUsageUpdate = Database['public']['Tables']['user_usage']['Update']

// Extended types for UI
export interface ProfileWithStats extends Profile {
  stack_items_count: number
  protocols_count: number
  uploads_count: number
}

// User tier limits
export const TIER_LIMITS = {
  free: {
    stack_items: 10,
    protocols: 5,
    uploads: 3,
  },
  pro: {
    stack_items: -1, // unlimited
    protocols: -1, // unlimited
    uploads: -1, // unlimited
  },
} as const

export type UserTier = keyof typeof TIER_LIMITS

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
          tier?: string
          show_journal_public?: boolean
          show_library?: boolean
          nutrition_signature?: any
          custom_logo_url?: string | null
          custom_branding_enabled?: boolean
          allow_stack_follow?: boolean
          show_public_followers?: boolean
          public_modules?: any
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
          tier?: string
          show_journal_public?: boolean
          show_library?: boolean
          nutrition_signature?: any
          custom_logo_url?: string | null
          custom_branding_enabled?: boolean
          allow_stack_follow?: boolean
          show_public_followers?: boolean
          public_modules?: any
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
          tier?: string
          show_journal_public?: boolean
          show_library?: boolean
          nutrition_signature?: any
          custom_logo_url?: string | null
          custom_branding_enabled?: boolean
          allow_stack_follow?: boolean
          show_public_followers?: boolean
          public_modules?: any
        }
      }
      user_usage: {
        Row: {
          id: string
          user_id: string
          tier: string
          stack_items_limit: number
          protocols_limit: number
          uploads_limit: number
          is_in_trial: boolean
          trial_started_at: string | null
          trial_ended_at: string | null
          created_at: string
          updated_at: string
          stripe_customer_id?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tier?: string
          stack_items_limit?: number
          protocols_limit?: number
          uploads_limit?: number
          is_in_trial?: boolean
          trial_started_at?: string | null
          trial_ended_at?: string | null
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tier?: string
          stack_items_limit?: number
          protocols_limit?: number
          uploads_limit?: number
          is_in_trial?: boolean
          trial_started_at?: string | null
          trial_ended_at?: string | null
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
        }
      }
      stack_followers: {
        Row: {
          id: string
          owner_user_id: string
          follower_email: string
          created_at: string
          verified: boolean
        }
        Insert: {
          id?: string
          owner_user_id: string
          follower_email: string
          created_at?: string
          verified?: boolean
        }
        Update: {
          id?: string
          owner_user_id?: string
          follower_email?: string
          created_at?: string
          verified?: boolean
        }
      }
      gear: {
        Row: {
          id: string
          profile_id: string
          name: string
          description: string | null
          brand: string | null
          category: string | null
          price: string | null
          affiliate_url: string | null
          image_url: string | null
          public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          description?: string | null
          brand?: string | null
          category?: string | null
          price?: string | null
          affiliate_url?: string | null
          image_url?: string | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          description?: string | null
          brand?: string | null
          category?: string | null
          price?: string | null
          affiliate_url?: string | null
          image_url?: string | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      library: {
        Row: {
          id: string
          profile_id: string
          name: string
          description: string | null
          category: string
          file_type: string
          file_url: string
          file_size: number
          thumbnail_url: string | null
          public: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          description?: string | null
          category: string
          file_type: string
          file_url: string
          file_size: number
          thumbnail_url?: string | null
          public?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          description?: string | null
          category?: string
          file_type?: string
          file_url?: string
          file_size?: number
          thumbnail_url?: string | null
          public?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          profile_id: string
          title: string
          content: string
          mood: string | null
          energy_level: number | null
          public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          content: string
          mood?: string | null
          energy_level?: number | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          title?: string
          content?: string
          mood?: string | null
          energy_level?: number | null
          public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          profile_id: string
          email_enabled: boolean
          daily_reminder_enabled: boolean
          reminder_time: string
          timezone: string
          supplements_reminder: boolean
          protocols_reminder: boolean
          movement_reminder: boolean
          mindfulness_reminder: boolean
          missed_items_reminder: boolean
          weekly_summary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          email_enabled?: boolean
          daily_reminder_enabled?: boolean
          reminder_time?: string
          timezone?: string
          supplements_reminder?: boolean
          protocols_reminder?: boolean
          movement_reminder?: boolean
          mindfulness_reminder?: boolean
          missed_items_reminder?: boolean
          weekly_summary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          email_enabled?: boolean
          daily_reminder_enabled?: boolean
          reminder_time?: string
          timezone?: string
          supplements_reminder?: boolean
          protocols_reminder?: boolean
          movement_reminder?: boolean
          mindfulness_reminder?: boolean
          missed_items_reminder?: boolean
          weekly_summary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notification_queue: {
        Row: {
          id: string
          profile_id: string
          notification_type: string
          scheduled_for: string
          status: string
          attempts: number
          sent_at: string | null
          error_message: string | null
          email_data: any
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          notification_type: string
          scheduled_for: string
          status?: string
          attempts?: number
          sent_at?: string | null
          error_message?: string | null
          email_data?: any
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          notification_type?: string
          scheduled_for?: string
          status?: string
          attempts?: number
          sent_at?: string | null
          error_message?: string | null
          email_data?: any
          created_at?: string
        }
      }
      plan_limits: {
        Row: {
          id: string
          tier: string
          feature_name: string
          limit_value: number
          created_at: string
        }
        Insert: {
          id?: string
          tier: string
          feature_name: string
          limit_value: number
          created_at?: string
        }
        Update: {
          id?: string
          tier?: string
          feature_name?: string
          limit_value?: number
          created_at?: string
        }
      }
      pricing_config: {
        Row: {
          id: string
          plan_name: string
          price_monthly: number
          price_yearly: number
          features: any
          created_at: string
        }
        Insert: {
          id?: string
          plan_name: string
          price_monthly: number
          price_yearly: number
          features: any
          created_at?: string
        }
        Update: {
          id?: string
          plan_name?: string
          price_monthly?: number
          price_yearly?: number
          features?: any
          created_at?: string
        }
      }
      shop_gear_items: {
        Row: {
          id: string
          profile_id: string
          name: string
          description: string | null
          brand: string | null
          category: string | null
          price: string | null
          affiliate_url: string
          image_url: string | null
          commission_rate: string | null
          featured: boolean
          sort_order: number
          public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          description?: string | null
          brand?: string | null
          category?: string | null
          price?: string | null
          affiliate_url: string
          image_url?: string | null
          commission_rate?: string | null
          featured?: boolean
          sort_order?: number
          public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          description?: string | null
          brand?: string | null
          category?: string | null
          price?: string | null
          affiliate_url?: string
          image_url?: string | null
          commission_rate?: string | null
          featured?: boolean
          sort_order?: number
          public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      stack_change_log: {
        Row: {
          id: string
          owner_user_id: string
          item_type: string
          item_id: string
          change_type: string
          fields: any | null
          is_public: boolean
          changed_at: string
        }
        Insert: {
          id?: string
          owner_user_id: string
          item_type: string
          item_id: string
          change_type: string
          fields?: any | null
          is_public?: boolean
          changed_at?: string
        }
        Update: {
          id?: string
          owner_user_id?: string
          item_type?: string
          item_id?: string
          change_type?: string
          fields?: any | null
          is_public?: boolean
          changed_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      contact_submissions: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          subject: string
          category: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          subject: string
          category: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          subject?: string
          category?: string
          message?: string
          created_at?: string
        }
      }
      daily_updates: {
        Row: {
          id: string
          profile_id: string
          energy_level: number
          mood: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          energy_level: number
          mood?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          energy_level?: number
          mood?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      daily_update_shares: {
        Row: {
          id: string
          profile_id: string
          share_url: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          share_url: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          share_url?: string
          created_at?: string
        }
      }
      email_log: {
        Row: {
          id: string
          user_id: string
          email_type: string
          sent_at: string
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          email_type: string
          sent_at?: string
          status?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_type?: string
          sent_at?: string
          status?: string
        }
      }
      email_prefs: {
        Row: {
          id: string
          user_id: string
          email_enabled: boolean
          daily_reminder: boolean
          weekly_summary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_enabled?: boolean
          daily_reminder?: boolean
          weekly_summary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_enabled?: boolean
          daily_reminder?: boolean
          weekly_summary?: boolean
          created_at?: string
        }
      }
      avatars: {
        Row: {
          id: string
          name: string
          bucket_id: string
          owner: string
          created_at: string
          updated_at: string
          last_accessed_at: string
          metadata: any
        }
        Insert: {
          id?: string
          name: string
          bucket_id: string
          owner: string
          created_at?: string
          updated_at?: string
          last_accessed_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          name?: string
          bucket_id?: string
          owner?: string
          created_at?: string
          updated_at?: string
          last_accessed_at?: string
          metadata?: any
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
    stack_items: 12,
    protocols: 12,
    uploads: 3,
  },
  pro: {
    stack_items: -1, // unlimited
    protocols: -1, // unlimited
    uploads: -1, // unlimited
  },
} as const

export type UserTier = keyof typeof TIER_LIMITS

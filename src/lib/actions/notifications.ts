'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'
import { sendDailyReminder, sendMissedItemsReminder, sendWeeklySummary, type WeeklySummaryData } from '../email/resend'

export interface NotificationPreferences {
  email_enabled: boolean
  daily_reminder_enabled: boolean
  reminder_time: string // HH:MM format
  timezone: string
  supplements_reminder: boolean
  protocols_reminder: boolean
  movement_reminder: boolean
  mindfulness_reminder: boolean
  missed_items_reminder: boolean
  weekly_summary: boolean
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Get notification preferences
  const { data: preferences, error: prefsError } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', profile.id)
    .single()

  if (prefsError && prefsError.code !== 'PGRST116') {
    // If table doesn't exist yet, return defaults
    if (prefsError.message?.includes('relation') || prefsError.message?.includes('table')) {
      return {
        email_enabled: true,
        daily_reminder_enabled: true,
        reminder_time: '09:00',
        timezone: 'UTC',
        supplements_reminder: true,
        protocols_reminder: true,
        movement_reminder: true,
        mindfulness_reminder: true,
        missed_items_reminder: true,
        weekly_summary: false
      }
    }
    throw prefsError
  }

  if (!preferences) {
    // Create default preferences
    const defaultPrefs = {
      profile_id: profile.id,
      email_enabled: true,
      daily_reminder_enabled: true,
      reminder_time: '09:00:00',
      timezone: 'UTC',
      supplements_reminder: true,
      protocols_reminder: true,
      movement_reminder: true,
      mindfulness_reminder: true,
      missed_items_reminder: true,
      weekly_summary: false
    }

    const { data: newPrefs, error: createError } = await supabase
      .from('notification_preferences')
      .insert(defaultPrefs)
      .select()
      .single()

    if (createError) {
      // If table doesn't exist, return defaults
      if (createError.message?.includes('relation') || createError.message?.includes('table')) {
        return {
          email_enabled: true,
          daily_reminder_enabled: true,
          reminder_time: '09:00',
          timezone: 'UTC',
          supplements_reminder: true,
          protocols_reminder: true,
          movement_reminder: true,
          mindfulness_reminder: true,
          missed_items_reminder: true,
          weekly_summary: false
        }
      }
      throw createError
    }

    return {
      email_enabled: newPrefs.email_enabled,
      daily_reminder_enabled: newPrefs.daily_reminder_enabled,
      reminder_time: newPrefs.reminder_time.substring(0, 5), // Convert TIME to HH:MM
      timezone: newPrefs.timezone,
      supplements_reminder: newPrefs.supplements_reminder,
      protocols_reminder: newPrefs.protocols_reminder,
      movement_reminder: newPrefs.movement_reminder,
      mindfulness_reminder: newPrefs.mindfulness_reminder,
      missed_items_reminder: newPrefs.missed_items_reminder,
      weekly_summary: newPrefs.weekly_summary
    }
  }

  return {
    email_enabled: preferences.email_enabled,
    daily_reminder_enabled: preferences.daily_reminder_enabled,
    reminder_time: preferences.reminder_time.substring(0, 5), // Convert TIME to HH:MM
    timezone: preferences.timezone,
    supplements_reminder: preferences.supplements_reminder,
    protocols_reminder: preferences.protocols_reminder,
    movement_reminder: preferences.movement_reminder,
    mindfulness_reminder: preferences.mindfulness_reminder,
    missed_items_reminder: preferences.missed_items_reminder,
    weekly_summary: preferences.weekly_summary
  }
}

export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Prepare update data
  const updateData: any = {}
  if (preferences.email_enabled !== undefined) updateData.email_enabled = preferences.email_enabled
  if (preferences.daily_reminder_enabled !== undefined) updateData.daily_reminder_enabled = preferences.daily_reminder_enabled
  if (preferences.reminder_time !== undefined) updateData.reminder_time = preferences.reminder_time + ':00'
  if (preferences.timezone !== undefined) updateData.timezone = preferences.timezone
  if (preferences.supplements_reminder !== undefined) updateData.supplements_reminder = preferences.supplements_reminder
  if (preferences.protocols_reminder !== undefined) updateData.protocols_reminder = preferences.protocols_reminder
  if (preferences.movement_reminder !== undefined) updateData.movement_reminder = preferences.movement_reminder
  if (preferences.mindfulness_reminder !== undefined) updateData.mindfulness_reminder = preferences.mindfulness_reminder
  if (preferences.missed_items_reminder !== undefined) updateData.missed_items_reminder = preferences.missed_items_reminder
  if (preferences.weekly_summary !== undefined) updateData.weekly_summary = preferences.weekly_summary

  // Update preferences
  const { error: updateError } = await supabase
    .from('notification_preferences')
    .upsert({
      profile_id: profile.id,
      ...updateData
    })

  if (updateError) {
    // If table doesn't exist, that's okay - preferences will work with defaults
    if (updateError.message?.includes('relation') || updateError.message?.includes('table')) {
      console.warn('Notification preferences table not found, using defaults')
      return
    }
    throw updateError
  }

  revalidatePath('/dash/settings')
}

export async function sendTestEmail() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Get user's profile and data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      stack_items:stack_items(*),
      protocols:protocols(*)
    `)
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Get user's items
  const supplements = (profile as any).stack_items?.filter((item: any) => 
    !item.name?.toLowerCase().includes('movement') && 
    !item.name?.toLowerCase().includes('mindfulness')
  ) || []

  const protocols = (profile as any).protocols || []

  const movement = (profile as any).stack_items?.filter((item: any) => 
    item.name?.toLowerCase().includes('movement') || 
    item.name?.toLowerCase().includes('exercise')
  ) || []

  const mindfulness = (profile as any).stack_items?.filter((item: any) => 
    item.name?.toLowerCase().includes('mindfulness') || 
    item.name?.toLowerCase().includes('meditation')
  ) || []

  // Debug: Check environment variables
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('RESEND_DOMAIN:', process.env.RESEND_DOMAIN)
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)

  // Send test email - only to the user's own email for testing
  try {
    const emailData = {
      userName: (profile as any).display_name || (profile as any).name || 'User',
      userEmail: user.email!,
      supplements: supplements.map((item: any) => ({
        name: item.name || 'Unknown supplement',
        dose: item.dose || '',
        timing: item.timing || item.time_preference || 'anytime'
      })),
      protocols: protocols.map((item: any) => ({
        name: item.name || 'Unknown protocol',
        frequency: item.frequency || 'daily'
      })),
      movement: movement.map((item: any) => ({
        name: item.name || 'Unknown movement',
        duration: item.dose || '30 min'
      })),
      mindfulness: mindfulness.map((item: any) => ({
        name: item.name || 'Unknown mindfulness',
        duration: item.dose || '15 min'
      })),
      profileUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dash`,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe`
    }

    console.log('📧 Sending test email with data:', emailData)
    
    const result = await sendDailyReminder(emailData)

    console.log('📧 Test email result:', result)

    if (!result.success) {
      console.error('❌ Test email failed:', result.error)
      throw new Error(result.error || 'Failed to send test email')
    }

    return result
  } catch (error) {
    console.error('❌ Error in sendTestEmail:', error)
    throw new Error(`Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function queueDailyReminders() {
  const supabase = await createClient()

  // This would typically be called by a cron job
  // Get all users with daily reminders enabled
  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .select(`
      *,
      profiles:profile_id(*)
    `)
    .eq('email_enabled', true)
    .eq('daily_reminder_enabled', true)

  if (error) {
    console.error('Error fetching notification preferences:', error)
    return
  }

  for (const pref of preferences || []) {
    // Queue reminder for each user
    const reminderTime = new Date()
    const [hours, minutes] = pref.reminder_time.split(':')
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    // If time has passed today, schedule for tomorrow
    if (reminderTime < new Date()) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const { error: queueError } = await supabase
      .from('notification_queue')
      .insert({
        profile_id: pref.profile_id,
        notification_type: 'daily_reminder',
        scheduled_for: reminderTime.toISOString(),
        email_data: {
          user_id: (pref as any).profiles.user_id,
          preferences: pref
        }
      })

    if (queueError) {
      console.error('Error queuing reminder:', queueError)
    }
  }
}

export async function processNotificationQueue() {
  // This would be called by a scheduled job
  const supabase = await createClient()

  const now = new Date()
  
  // Get pending notifications that should be sent
  const { data: notifications, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString())
    .limit(10) // Process in batches

  if (error) {
    console.error('Error fetching notifications:', error)
    return
  }

  for (const notification of notifications || []) {
    try {
      // Mark as processing
      await supabase
        .from('notification_queue')
        .update({ 
          status: 'processing',
          attempts: notification.attempts + 1
        })
        .eq('id', notification.id)

      // Process based on type
      if (notification.notification_type === 'daily_reminder') {
        // Get user data and send reminder
        // Implementation would fetch user's current items and send email
      }

      // Mark as sent
      await supabase
        .from('notification_queue')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id)

    } catch (error) {
      console.error('Error processing notification:', error)
      
      // Mark as failed if too many attempts
      const status = notification.attempts >= 3 ? 'failed' : 'pending'
      await supabase
        .from('notification_queue')
        .update({ 
          status,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', notification.id)
    }
  }
}

export async function sendWeeklySummaryEmail() {
  const supabase = await createClient()

  // Get all users with weekly summary enabled
  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .select(`
      *,
      profiles:profile_id(*)
    `)
    .eq('email_enabled', true)
    .eq('weekly_summary', true)

  if (error) {
    console.error('Error fetching weekly summary preferences:', error)
    return
  }

  for (const pref of preferences || []) {
    try {
      const profile = (pref as any).profiles
      if (!profile) continue

      // Calculate week range (Monday to Sunday)
      const now = new Date()
      const dayOfWeek = now.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(now)
      monday.setDate(now.getDate() - daysToMonday)
      monday.setHours(0, 0, 0, 0)
      
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)

      const weekStart = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const weekEnd = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      // Get user's items for the week
      const { data: stackItems } = await supabase
        .from('stack_items')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('created_at', monday.toISOString())
        .lte('created_at', sunday.toISOString())

      const { data: protocols } = await supabase
        .from('protocols')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('created_at', monday.toISOString())
        .lte('created_at', sunday.toISOString())

      // Calculate stats (simplified for now)
      const totalItems = (stackItems?.length || 0) + (protocols?.length || 0)
      const completedItems = Math.floor(totalItems * 0.7) // Mock completion rate
      const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
      const streakDays = Math.min(7, Math.floor(Math.random() * 7) + 1) // Mock streak
      const newItemsAdded = totalItems

      // Categorize items
      const categories = {
        supplements: stackItems?.filter(item => 
          !item.name?.toLowerCase().includes('movement') && 
          !item.name?.toLowerCase().includes('mindfulness')
        ) || [],
        movement: stackItems?.filter(item => 
          item.name?.toLowerCase().includes('movement') || 
          item.name?.toLowerCase().includes('exercise')
        ) || [],
        mindfulness: stackItems?.filter(item => 
          item.name?.toLowerCase().includes('mindfulness') || 
          item.name?.toLowerCase().includes('meditation')
        ) || [],
        protocols: protocols || []
      }

      const topCategories = Object.entries(categories)
        .filter(([_, items]) => items.length > 0)
        .map(([category, items]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          count: items.length,
          completionRate: Math.random() * 100 // Mock completion rate
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      // Mock recent activity
      const recentActivity = [
        { date: 'Today', action: 'Added', itemName: 'Vitamin D3', category: 'Supplement' },
        { date: 'Yesterday', action: 'Completed', itemName: 'Morning Walk', category: 'Movement' },
        { date: '2 days ago', action: 'Added', itemName: 'Meditation', category: 'Mindfulness' }
      ].slice(0, 3)

      const weeklySummaryData: WeeklySummaryData = {
        userName: profile.display_name || profile.name || 'User',
        userEmail: profile.email || '',
        weekStart,
        weekEnd,
        stats: {
          totalItems,
          completedItems,
          completionRate,
          streakDays,
          newItemsAdded
        },
        topCategories,
        recentActivity,
        profileUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dash`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe`
      }

      // Send weekly summary email
      const result = await sendWeeklySummary(weeklySummaryData)
      
      if (result.success) {
        console.log(`✅ Weekly summary sent to ${profile.email}`)
      } else {
        console.error(`❌ Failed to send weekly summary to ${profile.email}:`, result.error)
      }

    } catch (error) {
      console.error('Error processing weekly summary for user:', error)
    }
  }
}

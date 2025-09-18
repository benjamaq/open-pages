'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export interface JournalEntry {
  id?: string
  profile_id: string
  heading?: string
  body: string
  public: boolean
  created_at?: string
  updated_at?: string
}

export async function createJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([entry])
    .select()
    .single()

  if (error) {
    console.error('Error creating journal entry:', error)
    
    // If table doesn't exist, provide helpful error message
    if (error.message?.includes('relation') || error.message?.includes('journal_entries')) {
      throw new Error('Journal feature not yet set up. Please run the database migration.')
    }
    
    throw new Error('Failed to create journal entry')
  }

  revalidatePath('/dash')
  revalidatePath('/u/[slug]', 'page')
  
  return data
}

export async function updateJournalEntry(id: string, updates: Partial<Omit<JournalEntry, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating journal entry:', error)
    
    // If table doesn't exist, provide helpful error message
    if (error.message?.includes('relation') || error.message?.includes('journal_entries')) {
      throw new Error('Journal feature not yet set up. Please run the database migration.')
    }
    
    throw new Error('Failed to update journal entry')
  }

  revalidatePath('/dash')
  revalidatePath('/u/[slug]', 'page')
  
  return data
}

export async function deleteJournalEntry(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting journal entry:', error)
    throw new Error('Failed to delete journal entry')
  }

  revalidatePath('/dash')
  revalidatePath('/u/[slug]', 'page')
}

export async function getJournalEntries(profileId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching journal entries:', error)
    throw new Error('Failed to fetch journal entries')
  }

  return data
}

export async function updateProfileJournalSettings(profileId: string, showJournalPublic: boolean) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ show_journal_public: showJournalPublic })
    .eq('id', profileId)
    .select()
    .single()

  if (error) {
    console.error('Error updating journal settings:', error)
    throw new Error('Failed to update journal settings')
  }

  revalidatePath('/dash')
  revalidatePath('/u/[slug]', 'page')
  
  return data
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useFirstCheckIn(userId: string | null) {
  const [isFirstCheckIn, setIsFirstCheckIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFirstCheckIn() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        
        // Check if user has any previous daily entries
        const { data, error } = await supabase
          .from('daily_entries')
          .select('id')
          .eq('user_id', userId)
          .limit(1);

        if (error) {
          console.error('Error checking first check-in:', error);
          setIsFirstCheckIn(true); // Default to true if error
        } else {
          // If no entries found, this is the first check-in
          setIsFirstCheckIn(data?.length === 0);
        }
      } catch (error) {
        console.error('Error in useFirstCheckIn:', error);
        setIsFirstCheckIn(true); // Default to true if error
      } finally {
        setLoading(false);
      }
    }

    checkFirstCheckIn();
  }, [userId]);

  return { isFirstCheckIn, loading };
}

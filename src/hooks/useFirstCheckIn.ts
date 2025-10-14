'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useFirstCheckIn(userId: string | null) {
  const [isFirstCheckIn, setIsFirstCheckIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFirstCheckIn() {
      if (!userId) {
        setIsFirstCheckIn(false);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        // Lightweight count-only query (no payload), more robust under RLS
        const { count, error } = await supabase
          .from('daily_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (error) {
          console.warn('useFirstCheckIn count error:', (error as any)?.message || error);
          setIsFirstCheckIn(false);
        } else {
          setIsFirstCheckIn((count || 0) === 0);
        }
      } catch (err) {
        console.warn('useFirstCheckIn exception:', (err as any)?.message || err);
        setIsFirstCheckIn(false);
      } finally {
        setLoading(false);
      }
    }

    checkFirstCheckIn();
  }, [userId]);

  return { isFirstCheckIn, loading };
}

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayISO, type ISODate } from '@/lib/dates';

/**
 * Today's date, kept current past midnight and when the app comes back from the
 * background, so a screen left open after a late shift doesn't show yesterday as today.
 */
export function useToday(): ISODate {
  const [today, setToday] = useState(todayISO);

  useEffect(() => {
    const refresh = () => setToday(todayISO());
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const now = new Date();
    const justAfterMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const timer = setTimeout(refresh, justAfterMidnight.getTime() - now.getTime());
    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [today]);

  return today;
}

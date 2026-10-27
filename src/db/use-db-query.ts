import { useFocusEffect } from 'expo-router';
import { addDatabaseChangeListener, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Database changes this close together cause one reload, so an import of thousands of rows isn't thousands of reloads. */
const CHANGE_BATCH_MS = 50;

/**
 * Runs a read query and re-runs it whenever the database changes or the screen
 * regains focus. Pass a memoized `query` (useCallback) so it only reloads when its inputs change.
 */
export function useDbQuery<T>(query: (db: SQLiteDatabase) => Promise<T>) {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    const request = ++latestRequest.current;
    query(db).then(
      (result) => {
        if (request !== latestRequest.current) return;
        setData(result);
        setError(null);
      },
      (e: unknown) => {
        if (request !== latestRequest.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      },
    );
  }, [db, query]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = addDatabaseChangeListener(() => {
      clearTimeout(timer);
      timer = setTimeout(reload, CHANGE_BATCH_MS);
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [reload]);

  useFocusEffect(reload);

  return { data, error, reload };
}

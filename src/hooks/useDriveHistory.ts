import { useState, useEffect, useCallback } from 'react';
import { getCompletedDrives, getDriveById } from '../db/queries/drives';

export interface DriveListItem {
  id: string;
  startTime: Date;
  endTime: Date | null;
  durationMs: number | null;
  distanceMeters: number | null;
  score: number | null;
  spillCount: number | null;
  potholeCount: number | null;
  difficulty: string;
}

/**
 * Hook for fetching completed drive history
 *
 * Usage:
 * ```tsx
 * const { drives, loading, error, refresh } = useDriveHistory();
 *
 * if (loading) return <Text>Loading...</Text>;
 * if (error) return <Text>Error: {error.message}</Text>;
 *
 * return (
 *   <FlatList
 *     data={drives}
 *     renderItem={({ item }) => <DriveItem drive={item} />}
 *     onRefresh={refresh}
 *     refreshing={loading}
 *   />
 * );
 * ```
 */
export function useDriveHistory(limit = 50) {
  const [drives, setDrives] = useState<DriveListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDrives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCompletedDrives(limit);
      setDrives(result as DriveListItem[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch drives'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  return {
    drives,
    loading,
    error,
    refresh: fetchDrives,
  };
}

/**
 * Hook for fetching a single drive with full details
 */
export function useDriveDetail(driveId: string | null) {
  const [drive, setDrive] = useState<Awaited<ReturnType<typeof getDriveById>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!driveId) {
      setDrive(null);
      return;
    }

    setLoading(true);
    setError(null);

    getDriveById(driveId)
      .then(result => setDrive(result ?? null))
      .catch(err => setError(err instanceof Error ? err : new Error('Failed to fetch drive')))
      .finally(() => setLoading(false));
  }, [driveId]);

  return { drive, loading, error };
}

/**
 * Group drives by day for display
 * Returns array of { date: string, label: string, drives: DriveListItem[] }
 */
export function groupDrivesByDay(drives: DriveListItem[]): { date: string; label: string; drives: DriveListItem[] }[] {
  const groups = new Map<string, DriveListItem[]>();

  for (const drive of drives) {
    const startTime = drive.startTime instanceof Date ? drive.startTime : new Date(drive.startTime);
    const date = startTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = groups.get(date) || [];
    existing.push(drive);
    groups.set(date, existing);
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return Array.from(groups.entries()).map(([date, drives]) => ({
    date,
    label: date === today ? 'Today' : date === yesterday ? 'Yesterday' : formatDateLabel(date),
    drives,
  }));
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

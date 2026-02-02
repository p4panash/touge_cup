import { eq, and } from 'drizzle-orm';
import { db, generateId } from '../client';
import { events } from '../schema';

export type EventType = 'spill' | 'pothole' | 'drive_start' | 'drive_end' | 'gps_lost' | 'gps_resumed';

export interface LogEventParams {
  driveId: string;
  type: EventType;
  timestamp: number;
  latitude?: number | null;
  longitude?: number | null;
  severity?: number | null;
  forgiven?: boolean;
}

/**
 * Log an event during a drive
 */
export async function logEvent(params: LogEventParams): Promise<string> {
  const id = generateId();
  await db.insert(events).values({
    id,
    driveId: params.driveId,
    type: params.type,
    timestamp: new Date(params.timestamp),
    latitude: params.latitude ?? null,
    longitude: params.longitude ?? null,
    severity: params.severity ?? null,
    forgiven: params.forgiven ?? false,
  });
  return id;
}

/**
 * Get all events for a drive
 */
export async function getEventsForDrive(driveId: string) {
  return db.select().from(events).where(eq(events.driveId, driveId));
}

/**
 * Count events by type for a drive
 */
export async function countEventsByType(driveId: string, type: EventType): Promise<number> {
  const result = await db.select().from(events)
    .where(and(eq(events.driveId, driveId), eq(events.type, type)));
  return result.length;
}

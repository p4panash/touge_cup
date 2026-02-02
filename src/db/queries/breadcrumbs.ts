import { eq } from 'drizzle-orm';
import { db, generateId } from '../client';
import { breadcrumbs } from '../schema';

export interface LogBreadcrumbParams {
  driveId: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  speed?: number | null;
}

/**
 * Log a GPS breadcrumb (called every ~5 seconds during drive)
 */
export async function logBreadcrumb(params: LogBreadcrumbParams): Promise<void> {
  await db.insert(breadcrumbs).values({
    id: generateId(),
    driveId: params.driveId,
    timestamp: new Date(params.timestamp),
    latitude: params.latitude,
    longitude: params.longitude,
    speed: params.speed ?? null,
  });
}

/**
 * Get all breadcrumbs for a drive (for route display)
 */
export async function getBreadcrumbsForDrive(driveId: string) {
  return db.select().from(breadcrumbs).where(eq(breadcrumbs.driveId, driveId));
}

/**
 * Calculate total distance from breadcrumbs using Haversine formula
 */
export function calculateDistance(crumbs: { latitude: number; longitude: number }[]): number {
  if (crumbs.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < crumbs.length; i++) {
    totalDistance += haversineDistance(
      crumbs[i - 1].latitude, crumbs[i - 1].longitude,
      crumbs[i].latitude, crumbs[i].longitude
    );
  }
  return totalDistance;
}

/**
 * Haversine distance between two points in meters
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

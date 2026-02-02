import { eq, desc, isNotNull } from 'drizzle-orm';
import { db, generateId } from '../client';
import { drives } from '../schema';
import type { DifficultyLevel } from '../../stores/useSensorStore';

export interface CreateDriveParams {
  startTime: number;
  difficulty: DifficultyLevel;
  manualStart: boolean;
}

export interface UpdateDriveParams {
  endTime?: number;
  durationMs?: number;
  distanceMeters?: number;
  score?: number;
  spillCount?: number;
  potholeCount?: number;
  manualEnd?: boolean;
}

/**
 * Create a new drive record when drive starts
 */
export async function createDrive(params: CreateDriveParams): Promise<string> {
  const id = generateId();
  await db.insert(drives).values({
    id,
    startTime: new Date(params.startTime),
    difficulty: params.difficulty,
    manualStart: params.manualStart,
  });
  return id;
}

/**
 * Update drive record (typically at drive end)
 */
export async function updateDrive(driveId: string, params: UpdateDriveParams): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (params.endTime !== undefined) {
    updateData.endTime = new Date(params.endTime);
  }
  if (params.durationMs !== undefined) {
    updateData.durationMs = params.durationMs;
  }
  if (params.distanceMeters !== undefined) {
    updateData.distanceMeters = params.distanceMeters;
  }
  if (params.score !== undefined) {
    updateData.score = params.score;
  }
  if (params.spillCount !== undefined) {
    updateData.spillCount = params.spillCount;
  }
  if (params.potholeCount !== undefined) {
    updateData.potholeCount = params.potholeCount;
  }
  if (params.manualEnd !== undefined) {
    updateData.manualEnd = params.manualEnd;
  }

  await db.update(drives).set(updateData).where(eq(drives.id, driveId));
}

/**
 * Get a drive by ID with events and breadcrumbs
 */
export async function getDriveById(driveId: string) {
  return db.query.drives.findFirst({
    where: eq(drives.id, driveId),
    with: {
      events: true,
      breadcrumbs: true,
    },
  });
}

/**
 * Get all completed drives, most recent first
 */
export async function getCompletedDrives(limit = 50) {
  return db.query.drives.findMany({
    where: isNotNull(drives.endTime),
    orderBy: desc(drives.startTime),
    limit,
  });
}

/**
 * Get drive list with summary stats (no events/breadcrumbs)
 */
export async function getDrivesList(limit = 50) {
  return db.select().from(drives)
    .where(isNotNull(drives.endTime))
    .orderBy(desc(drives.startTime))
    .limit(limit);
}

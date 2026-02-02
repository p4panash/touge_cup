/**
 * DriveRecorder Service
 *
 * Orchestrates drive session lifecycle and event capture.
 * Singleton pattern - one active drive at a time.
 *
 * Usage:
 * - Call startDrive() when drive detection transitions to 'driving'
 * - Call logSpill() from audio feedback when spill triggers
 * - Call logBreadcrumb() every 5 seconds during drive
 * - Call endDrive() when drive detection transitions to 'idle'
 */

import { createDrive, updateDrive } from '../db/queries/drives';
import { logEvent, getEventsForDrive } from '../db/queries/events';
import { logBreadcrumb, getBreadcrumbsForDrive, calculateDistance } from '../db/queries/breadcrumbs';
import { calculateScore } from '../scoring/calculateScore';
import type { DifficultyLevel } from '../stores/useSensorStore';
import type { LocationData } from '../drive/types';

/** Breadcrumb interval in milliseconds (5 seconds per requirements) */
const BREADCRUMB_INTERVAL_MS = 5000;

class DriveRecorderClass {
  private currentDriveId: string | null = null;
  private driveStartTime: number | null = null;
  private lastBreadcrumbTime: number = 0;
  private spillCount: number = 0;
  private potholeCount: number = 0;

  /**
   * Check if a drive is currently being recorded
   */
  isRecording(): boolean {
    return this.currentDriveId !== null;
  }

  /**
   * Get current drive ID (for debugging)
   */
  getCurrentDriveId(): string | null {
    return this.currentDriveId;
  }

  /**
   * Start recording a new drive
   * Called when drive state transitions to 'driving' or 'manual_driving'
   */
  async startDrive(params: {
    startTime: number;
    difficulty: DifficultyLevel;
    manual: boolean;
    location?: LocationData | null;
  }): Promise<string> {
    // End any existing drive first (safety)
    if (this.currentDriveId) {
      console.warn('[DriveRecorder] Starting new drive while one is active, ending previous');
      await this.endDrive({ endTime: params.startTime, manual: false });
    }

    const driveId = await createDrive({
      startTime: params.startTime,
      difficulty: params.difficulty,
      manualStart: params.manual,
    });

    this.currentDriveId = driveId;
    this.driveStartTime = params.startTime;
    this.lastBreadcrumbTime = 0;
    this.spillCount = 0;
    this.potholeCount = 0;

    // Log drive_start event
    await logEvent({
      driveId,
      type: 'drive_start',
      timestamp: params.startTime,
      latitude: params.location?.latitude,
      longitude: params.location?.longitude,
    });

    // Log initial breadcrumb if location available
    if (params.location) {
      await this.recordBreadcrumb(params.location);
    }

    console.log(`[DriveRecorder] Drive started: ${driveId}`);
    return driveId;
  }

  /**
   * End the current drive
   * Called when drive state transitions to 'idle' from 'stopping'
   */
  async endDrive(params: {
    endTime: number;
    manual: boolean;
    location?: LocationData | null;
  }): Promise<void> {
    if (!this.currentDriveId || !this.driveStartTime) {
      console.warn('[DriveRecorder] No active drive to end');
      return;
    }

    const driveId = this.currentDriveId;
    const durationMs = params.endTime - this.driveStartTime;

    // Log drive_end event
    await logEvent({
      driveId,
      type: 'drive_end',
      timestamp: params.endTime,
      latitude: params.location?.latitude,
      longitude: params.location?.longitude,
    });

    // Calculate distance from breadcrumbs
    const breadcrumbs = await getBreadcrumbsForDrive(driveId);
    const distanceMeters = calculateDistance(breadcrumbs);

    // Get spill events for scoring
    const events = await getEventsForDrive(driveId);
    const spillEvents = events
      .filter(e => e.type === 'spill')
      .map(e => ({ severity: e.severity }));

    // Calculate score (the "reveal moment" per CONTEXT.md)
    const scoreResult = calculateScore({
      spillEvents,
      durationMs,
    });

    // Update drive record with final stats INCLUDING score
    await updateDrive(driveId, {
      endTime: params.endTime,
      durationMs,
      distanceMeters,
      score: scoreResult.score,
      spillCount: this.spillCount,
      potholeCount: this.potholeCount,
      manualEnd: params.manual,
    });

    console.log(`[DriveRecorder] Drive ended: ${driveId}, score: ${scoreResult.score}${scoreResult.isPerfect ? ' (PERFECT!)' : ''}, spills: ${this.spillCount}`);

    // Reset state
    this.currentDriveId = null;
    this.driveStartTime = null;
    this.lastBreadcrumbTime = 0;
    this.spillCount = 0;
    this.potholeCount = 0;
  }

  /**
   * Log a spill event
   * Called from useAudioFeedback when spill sound triggers
   */
  async logSpill(params: {
    timestamp: number;
    location?: LocationData | null;
    severity: number; // risk value at time of spill (0-1)
  }): Promise<void> {
    if (!this.currentDriveId) {
      // Silently ignore spills outside of active drives
      return;
    }

    this.spillCount++;
    await logEvent({
      driveId: this.currentDriveId,
      type: 'spill',
      timestamp: params.timestamp,
      latitude: params.location?.latitude,
      longitude: params.location?.longitude,
      severity: params.severity,
    });

    console.log(`[DriveRecorder] Spill logged (${this.spillCount} total), severity: ${params.severity.toFixed(2)}`);
  }

  /**
   * Log a pothole event
   * Called from pothole detection (Phase 5, but we add the hook now)
   */
  async logPothole(params: {
    timestamp: number;
    location?: LocationData | null;
    severity: number;
    forgiven: boolean;
  }): Promise<void> {
    if (!this.currentDriveId) return;

    if (!params.forgiven) {
      this.potholeCount++;
    }

    await logEvent({
      driveId: this.currentDriveId,
      type: 'pothole',
      timestamp: params.timestamp,
      latitude: params.location?.latitude,
      longitude: params.location?.longitude,
      severity: params.severity,
      forgiven: params.forgiven,
    });

    console.log(`[DriveRecorder] Pothole logged, forgiven: ${params.forgiven}`);
  }

  /**
   * Record GPS breadcrumb
   * Should be called with every location update; internally throttles to 5s intervals
   */
  async recordBreadcrumb(location: LocationData): Promise<void> {
    if (!this.currentDriveId) return;

    // Throttle to BREADCRUMB_INTERVAL_MS
    const now = location.timestamp;
    if (now - this.lastBreadcrumbTime < BREADCRUMB_INTERVAL_MS) {
      return;
    }

    this.lastBreadcrumbTime = now;
    await logBreadcrumb({
      driveId: this.currentDriveId,
      timestamp: now,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed,
    });
  }

  /**
   * Log GPS lost event
   */
  async logGpsLost(timestamp: number): Promise<void> {
    if (!this.currentDriveId) return;

    await logEvent({
      driveId: this.currentDriveId,
      type: 'gps_lost',
      timestamp,
    });
  }

  /**
   * Log GPS resumed event
   */
  async logGpsResumed(timestamp: number, location: LocationData): Promise<void> {
    if (!this.currentDriveId) return;

    await logEvent({
      driveId: this.currentDriveId,
      type: 'gps_resumed',
      timestamp,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }

  /**
   * Get stats for current drive (for UI display during drive)
   */
  getCurrentStats(): { spillCount: number; potholeCount: number; durationMs: number } | null {
    if (!this.currentDriveId || !this.driveStartTime) return null;

    return {
      spillCount: this.spillCount,
      potholeCount: this.potholeCount,
      durationMs: Date.now() - this.driveStartTime,
    };
  }
}

// Singleton instance
export const DriveRecorder = new DriveRecorderClass();

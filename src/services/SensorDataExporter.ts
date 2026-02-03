/**
 * SensorDataExporter Service
 *
 * Buffers sensor readings during drives and exports as CSV for analysis.
 * Used to tune difficulty thresholds based on real driving data.
 *
 * CSV columns:
 * - timestamp: Unix ms
 * - x, y, z: Filtered acceleration (m/s²)
 * - jerkX, jerkY, jerkMagnitude: Jerk values (m/s³)
 * - risk: Normalized risk 0-1
 * - zAccel: Raw Z acceleration for pothole analysis
 * - speed: GPS speed (m/s) if available
 * - event: 'spill' | 'pothole' | '' for that sample
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface SensorSample {
  timestamp: number;
  x: number;
  y: number;
  z: number;
  jerkX: number;
  jerkY: number;
  jerkMagnitude: number;
  risk: number;
  zAccel: number;
  speed: number | null;
  event: 'spill' | 'pothole' | '';
}

class SensorDataExporterClass {
  private samples: SensorSample[] = [];
  private isRecording: boolean = false;
  private driveId: string | null = null;
  private difficulty: string | null = null;

  /**
   * Start recording sensor data for a drive
   */
  startRecording(driveId: string, difficulty: string): void {
    this.samples = [];
    this.isRecording = true;
    this.driveId = driveId;
    this.difficulty = difficulty;
    console.log(`[SensorExporter] Started recording for drive ${driveId}`);
  }

  /**
   * Stop recording sensor data
   */
  stopRecording(): void {
    this.isRecording = false;
    console.log(`[SensorExporter] Stopped recording. ${this.samples.length} samples captured.`);
  }

  /**
   * Add a sensor sample (call from sensor pipeline)
   */
  addSample(sample: Omit<SensorSample, 'event'>): void {
    if (!this.isRecording) return;

    this.samples.push({
      ...sample,
      event: '',
    });
  }

  /**
   * Mark the last sample as having an event
   */
  markEvent(eventType: 'spill' | 'pothole'): void {
    if (!this.isRecording || this.samples.length === 0) return;

    // Mark the most recent sample
    this.samples[this.samples.length - 1].event = eventType;
  }

  /**
   * Get sample count for UI display
   */
  getSampleCount(): number {
    return this.samples.length;
  }

  /**
   * Check if we have data to export
   */
  hasData(): boolean {
    return this.samples.length > 0;
  }

  /**
   * Export data as CSV and open share sheet
   */
  async exportCSV(): Promise<void> {
    if (this.samples.length === 0) {
      console.warn('[SensorExporter] No data to export');
      return;
    }

    // Build CSV content
    const headers = [
      'timestamp',
      'x',
      'y',
      'z',
      'jerkX',
      'jerkY',
      'jerkMagnitude',
      'risk',
      'zAccel',
      'speed',
      'event',
    ].join(',');

    const rows = this.samples.map((s) =>
      [
        s.timestamp,
        s.x.toFixed(4),
        s.y.toFixed(4),
        s.z.toFixed(4),
        s.jerkX.toFixed(4),
        s.jerkY.toFixed(4),
        s.jerkMagnitude.toFixed(4),
        s.risk.toFixed(4),
        s.zAccel.toFixed(4),
        s.speed?.toFixed(2) ?? '',
        s.event,
      ].join(',')
    );

    const csv = [headers, ...rows].join('\n');

    // Generate filename with timestamp and difficulty
    const date = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const filename = `drive_${this.difficulty}_${date}.csv`;

    // Write file using new expo-file-system API
    const file = new File(Paths.cache, filename);
    await file.write(csv);

    console.log(`[SensorExporter] Wrote ${this.samples.length} samples to ${filename}`);

    // Share
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Sensor Data',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      console.warn('[SensorExporter] Sharing not available on this device');
    }
  }

  /**
   * Clear recorded data
   */
  clear(): void {
    this.samples = [];
    this.driveId = null;
    this.difficulty = null;
    this.isRecording = false;
  }
}

// Singleton instance
export const SensorDataExporter = new SensorDataExporterClass();

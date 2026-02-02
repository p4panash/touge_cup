/**
 * Drive detection state machine states
 *
 * State transitions:
 * - idle -> detecting: speed >= threshold
 * - detecting -> idle: speed drops below threshold before 5s
 * - detecting -> driving: speed sustained for 5s
 * - driving -> stopping: speed near zero
 * - stopping -> driving: speed resumes before 120s
 * - stopping -> idle: stationary for 120s
 * - manual_driving: user override, only manual stop works
 */
export type DriveState =
  | { type: 'idle' }
  | { type: 'detecting'; speedAboveThresholdSince: number }
  | { type: 'driving'; startTime: number }
  | { type: 'stopping'; stationarySince: number; driveStartTime: number }
  | { type: 'manual_driving'; startTime: number };

/**
 * Location data from GPS
 * Simplified from expo-location LocationObject
 */
export interface LocationData {
  /** Latitude in degrees */
  latitude: number;
  /** Longitude in degrees */
  longitude: number;
  /** Speed in m/s (may be null if unavailable) */
  speed: number | null;
  /** Timestamp when location was recorded */
  timestamp: number;
  /** Horizontal accuracy in meters */
  accuracy: number | null;
}

/**
 * Drive events for logging (Phase 3 will persist these)
 */
export type DriveEventType = 'drive_start' | 'drive_end' | 'gps_lost' | 'gps_resumed';

export interface DriveEvent {
  type: DriveEventType;
  timestamp: number;
  location: LocationData | null;
  /** For drive_end: was it auto-stop or manual */
  manual?: boolean;
}

/**
 * Permission status for location
 */
export type LocationPermissionStatus =
  | 'undetermined'
  | 'foreground_only'
  | 'background_granted'
  | 'denied';

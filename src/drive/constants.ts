/**
 * Drive detection constants
 * @see 02-CONTEXT.md for locked decisions
 */

/** Speed threshold for drive detection: 15 km/h in m/s */
export const SPEED_THRESHOLD_MS = 4.17;

/** Duration above threshold to start drive: 5 seconds */
export const START_DURATION_MS = 5000;

/** Duration stationary to stop drive: 120 seconds */
export const STOP_DURATION_MS = 120000;

/** Speed below which counts as "stationary": ~3.6 km/h in m/s */
export const STATIONARY_THRESHOLD_MS = 1.0;

/** Location update interval: 1 second */
export const LOCATION_UPDATE_INTERVAL_MS = 1000;

/** GPS breadcrumb interval for route tracking: 2 seconds */
export const BREADCRUMB_INTERVAL_MS = 2000;

/** Background task name for expo-task-manager */
export const LOCATION_TASK_NAME = 'background-location-task';

/** Foreground service notification config */
export const FOREGROUND_SERVICE_CONFIG = {
  notificationTitle: 'Water Cup Coach',
  notificationBody: 'Monitoring your driving...',
  notificationColor: '#3B82F6',
} as const;

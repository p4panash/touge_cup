/**
 * Type definitions for sensor data pipeline
 *
 * These types define the structure of motion sensor data as it flows
 * through the pipeline from DeviceMotion to the Zustand store.
 */

// Re-export pothole types for centralized access
export { PotholeEvent } from './processors/PotholeDetector';

/**
 * 3D vector representing acceleration or rotation values
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Raw sensor data from DeviceMotion
 * acceleration is gravity-compensated (isolated from phone tilt)
 */
export interface SensorData {
  /** Gravity-compensated acceleration in m/s^2 */
  acceleration: Vector3;
  /** Angular velocity in rad/s */
  rotationRate: Vector3;
  /** Timestamp in seconds since epoch */
  timestamp: number;
}

/**
 * Sensor data after passing through low-pass filter
 * Includes both raw and filtered acceleration for debugging
 */
export interface FilteredSensorData extends SensorData {
  /** Acceleration after low-pass filter removes high-frequency noise */
  filteredAcceleration: Vector3;
}

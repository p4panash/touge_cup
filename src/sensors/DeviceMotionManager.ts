import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors';
import { Subscription } from 'expo-sensors/build/DeviceSensor';
import { FilteredSensorData, Vector3 } from './types';
import { LowPassFilter } from './filters/LowPassFilter';

/**
 * Manages DeviceMotion sensor subscription lifecycle
 *
 * Wraps expo-sensors DeviceMotion to provide:
 * - 50Hz sampling rate (20ms intervals)
 * - Gravity-compensated acceleration (handled by DeviceMotion)
 * - Low-pass filtering for noise removal
 * - Clean start/stop lifecycle
 *
 * DeviceMotion.acceleration is used instead of raw Accelerometer because
 * it already has gravity removed, simplifying the pipeline.
 */
export class DeviceMotionManager {
  private subscription: Subscription | null = null;
  private lowPass: LowPassFilter;
  private callback: (data: FilteredSensorData) => void;

  /**
   * Create a new DeviceMotionManager
   * @param callback - Function called on each filtered sensor event (50Hz)
   * @param cutoffHz - Low-pass filter cutoff frequency (default: 2Hz)
   */
  constructor(
    callback: (data: FilteredSensorData) => void,
    cutoffHz: number = 2
  ) {
    this.callback = callback;
    this.lowPass = new LowPassFilter(cutoffHz, 50);
  }

  /**
   * Start listening to DeviceMotion sensor at 50Hz
   */
  start(): void {
    if (this.subscription) {
      // Already running
      return;
    }

    // Reset filter state for new session
    this.lowPass.reset();

    // Set update interval to 20ms = 50Hz
    // Note: Android 12+ requires HIGH_SAMPLING_RATE_SENSORS permission
    DeviceMotion.setUpdateInterval(20);

    // Subscribe to sensor events
    this.subscription = DeviceMotion.addListener(
      (data: DeviceMotionMeasurement) => {
        this.handleSensorEvent(data);
      }
    );
  }

  /**
   * Stop listening to DeviceMotion sensor
   */
  stop(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  /**
   * Check if sensor is currently active
   */
  isActive(): boolean {
    return this.subscription !== null;
  }

  /**
   * Handle incoming sensor event
   * Applies low-pass filter and invokes callback
   */
  private handleSensorEvent(data: DeviceMotionMeasurement): void {
    // DeviceMotion.acceleration can be null on some platforms
    if (!data.acceleration) {
      return;
    }

    // Extract raw acceleration (already gravity-compensated by DeviceMotion)
    const rawAcceleration: Vector3 = {
      x: data.acceleration.x ?? 0,
      y: data.acceleration.y ?? 0,
      z: data.acceleration.z ?? 0,
    };

    // Extract rotation rate
    const rotationRate: Vector3 = {
      x: data.rotation?.alpha ?? 0,
      y: data.rotation?.beta ?? 0,
      z: data.rotation?.gamma ?? 0,
    };

    // Apply low-pass filter to remove high-frequency vibration noise
    const filteredAcceleration = this.lowPass.apply(rawAcceleration);

    // Convert timestamp to seconds (expo-sensors uses milliseconds)
    const timestamp = Date.now() / 1000;

    // Build filtered sensor data
    const filteredData: FilteredSensorData = {
      acceleration: rawAcceleration,
      rotationRate,
      timestamp,
      filteredAcceleration,
    };

    // Invoke callback with filtered data
    this.callback(filteredData);
  }
}

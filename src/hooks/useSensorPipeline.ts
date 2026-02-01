import { useCallback, useRef, useEffect } from 'react';
import { DeviceMotionManager } from '../sensors/DeviceMotionManager';
import { SensorPipeline } from '../sensors/SensorPipeline';
import { useSensorStore, SETTLING_PERIOD_MS } from '../stores/useSensorStore';

/**
 * React hook connecting sensor subscription to processing pipeline
 *
 * Manages:
 * - DeviceMotionManager and SensorPipeline lifecycle
 * - Sensor event subscription/cleanup
 * - Pipeline processing and store updates
 * - Settling period (1500ms delay before feedback)
 *
 * @returns Control functions and state for sensor pipeline
 */
export function useSensorPipeline() {
  const managerRef = useRef<DeviceMotionManager | null>(null);
  const pipelineRef = useRef<SensorPipeline | null>(null);
  const settlingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store selectors
  const isActive = useSensorStore((state) => state.isActive);
  const isSettling = useSensorStore((state) => state.isSettling);
  const difficulty = useSensorStore((state) => state.difficulty);

  // Store actions
  const setActive = useSensorStore((state) => state.setActive);
  const setSettling = useSensorStore((state) => state.setSettling);
  const setLatestData = useSensorStore((state) => state.setLatestData);
  const updateRisk = useSensorStore((state) => state.updateRisk);
  const resetStore = useSensorStore((state) => state.reset);

  /**
   * Initialize pipeline with current difficulty
   */
  const initializePipeline = useCallback(() => {
    pipelineRef.current = new SensorPipeline();
    pipelineRef.current.setDifficulty(difficulty);
  }, [difficulty]);

  /**
   * Start sensor pipeline
   */
  const start = useCallback(() => {
    if (managerRef.current?.isActive()) {
      return; // Already running
    }

    // Initialize pipeline
    initializePipeline();

    // Create manager with callback that processes through pipeline
    managerRef.current = new DeviceMotionManager((data) => {
      // Update store with raw sensor data
      setLatestData(data);

      // Skip pipeline processing during settling period
      if (useSensorStore.getState().isSettling) {
        return;
      }

      // Process through pipeline
      if (pipelineRef.current) {
        const result = pipelineRef.current.process(
          data.filteredAcceleration,
          data.timestamp
        );

        // Update store with risk values
        updateRisk(result.risk, result.isSpill, result.jerk.magnitude);
      }
    });

    // Start sensor subscription
    managerRef.current.start();
    setActive(true);

    // Start settling period
    setSettling(true);
    settlingTimeoutRef.current = setTimeout(() => {
      setSettling(false);
      // Reset pipeline after settling to clear any accumulated state
      pipelineRef.current?.reset();
    }, SETTLING_PERIOD_MS);
  }, [
    initializePipeline,
    setActive,
    setSettling,
    setLatestData,
    updateRisk,
  ]);

  /**
   * Stop sensor pipeline
   */
  const stop = useCallback(() => {
    // Stop sensor manager
    if (managerRef.current) {
      managerRef.current.stop();
      managerRef.current = null;
    }

    // Clear settling timeout
    if (settlingTimeoutRef.current) {
      clearTimeout(settlingTimeoutRef.current);
      settlingTimeoutRef.current = null;
    }

    // Clear pipeline
    pipelineRef.current = null;

    // Reset store state
    resetStore();
  }, [resetStore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Update pipeline difficulty when it changes
  useEffect(() => {
    if (pipelineRef.current) {
      pipelineRef.current.setDifficulty(difficulty);
    }
  }, [difficulty]);

  return {
    /** Whether sensor subscription is active */
    isActive,
    /** Whether in settling period (no feedback) */
    isSettling,
    /** Start sensor pipeline */
    start,
    /** Stop sensor pipeline */
    stop,
  };
}

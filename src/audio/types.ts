/**
 * Sound names for audio feedback
 *
 * Graduated slosh sounds for different risk levels,
 * plus dramatic spill sound when threshold exceeded.
 */
export type SoundName = 'slosh-light' | 'slosh-medium' | 'slosh-heavy' | 'spill';

/**
 * All available sound names as an array for iteration
 */
export const SOUND_NAMES: SoundName[] = [
  'slosh-light',
  'slosh-medium',
  'slosh-heavy',
  'spill',
];

/**
 * Audio engine state
 */
export interface AudioState {
  /** Whether audio engine has been initialized */
  isInitialized: boolean;
  /** Whether audio is interrupted (phone call, nav prompt) */
  isInterrupted: boolean;
  /** Volume level (0-1), independent of system volume */
  volume: number;
}

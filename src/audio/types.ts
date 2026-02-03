/**
 * Sound names for audio feedback
 *
 * Graduated slosh sounds for different risk levels,
 * plus dramatic spill sound when threshold exceeded.
 * Master mode adds ambient-tension loop and enhanced sounds.
 */
export type SoundName =
  | 'slosh-light'
  | 'slosh-medium'
  | 'slosh-heavy'
  | 'spill'
  | 'spill-dramatic'
  | 'pothole-bump'
  | 'ambient-tension';

/**
 * Sound names that are preloaded by AudioEngine (one-shot sounds)
 * Note: ambient-tension is excluded - it's managed separately by AmbientAudioController
 */
export type PreloadedSoundName =
  | 'slosh-light'
  | 'slosh-medium'
  | 'slosh-heavy'
  | 'spill'
  | 'spill-dramatic'
  | 'pothole-bump';

/**
 * All preloaded sound names as an array for iteration
 */
export const SOUND_NAMES: PreloadedSoundName[] = [
  'slosh-light',
  'slosh-medium',
  'slosh-heavy',
  'spill',
  'spill-dramatic',
  'pothole-bump',
];

/**
 * Ambient sounds that loop continuously (managed by AmbientAudioController)
 */
export const AMBIENT_SOUNDS: SoundName[] = ['ambient-tension'];

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

/**
 * Central motion presets and transitions for ApexCaliber visualizers and UI.
 * Adheres to prefers-reduced-motion safety and critically damped curves.
 */

export const motionPresets = {
  spring: {
    snappy: { type: 'spring', stiffness: 420, damping: 32, mass: 1 },
    soft: { type: 'spring', stiffness: 220, damping: 26, mass: 1 },
  },
  ease: {
    out: [0.2, 0.8, 0.2, 1] as const,
    enter: [0.22, 1, 0.36, 1] as const,
    travel: [0.65, 0, 0.35, 1] as const,
    inOut: [0.4, 0, 0.2, 1] as const,
  },
  duration: {
    press: 0.09,
    fast: 0.15,
    normal: 0.22,
    slide: 0.24,
    deliberate: 0.36,
    swap: 0.42,
  },
} as const

/** Checks if the user environment prefers reduced motion. */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Calculates safe step playback duration ensuring swap/move transitions complete. */
export function getMinStepDuration(speed: number, animationDurationMs = 420): number {
  const baseStepDelay = 650 / speed
  return Math.max(baseStepDelay, animationDurationMs + 80)
}

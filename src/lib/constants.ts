/** Max raw diff characters before fail-open policy applies. */
export const MAX_DIFF_CHARS = 80_000;

/** Balanced tier thresholds (score 0–100). */
export const TIER_THRESHOLDS = {
  low: 25,
  medium: 50,
  high: 75,
} as const;

import type { SourceType, Strength, Priority } from '@/lib/scoring/types';

export const SOURCE_TYPE_WEIGHTS: Record<SourceType, number> = {
  official: 1.0,
  github: 0.8,
  blog: 0.6,
  community: 0.4,
} as const;

export const STRENGTH_MULTIPLIERS: Record<Strength, number> = {
  strong: 1.0,
  moderate: 0.7,
  weak: 0.4,
} as const;

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
} as const;

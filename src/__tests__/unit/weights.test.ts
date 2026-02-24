import { describe, it, expect } from 'vitest';
import { SOURCE_TYPE_WEIGHTS, STRENGTH_MULTIPLIERS, PRIORITY_WEIGHTS } from '@/lib/scoring/weights';

describe('SOURCE_TYPE_WEIGHTS', () => {
  it('official docs = 1.0', () => expect(SOURCE_TYPE_WEIGHTS.official).toBe(1.0));
  it('github = 0.8', () => expect(SOURCE_TYPE_WEIGHTS.github).toBe(0.8));
  it('blog = 0.6', () => expect(SOURCE_TYPE_WEIGHTS.blog).toBe(0.6));
  it('community = 0.4', () => expect(SOURCE_TYPE_WEIGHTS.community).toBe(0.4));
});

describe('STRENGTH_MULTIPLIERS', () => {
  it('strong = 1.0', () => expect(STRENGTH_MULTIPLIERS.strong).toBe(1.0));
  it('moderate = 0.7', () => expect(STRENGTH_MULTIPLIERS.moderate).toBe(0.7));
  it('weak = 0.4', () => expect(STRENGTH_MULTIPLIERS.weak).toBe(0.4));
});

describe('PRIORITY_WEIGHTS', () => {
  it('high = 3', () => expect(PRIORITY_WEIGHTS.high).toBe(3));
  it('medium = 2', () => expect(PRIORITY_WEIGHTS.medium).toBe(2));
  it('low = 1', () => expect(PRIORITY_WEIGHTS.low).toBe(1));
});

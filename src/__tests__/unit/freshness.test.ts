import { describe, it, expect } from 'vitest';
import { getFreshnessLevel, getRecencyMultiplier } from '@/lib/utils/freshness';

describe('getFreshnessLevel', () => {
  it('returns fresh for dates < 90 days ago', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 30);
    expect(getFreshnessLevel(recent.toISOString())).toBe('fresh');
  });

  it('returns aging for dates 90-365 days ago', () => {
    const aging = new Date();
    aging.setDate(aging.getDate() - 200);
    expect(getFreshnessLevel(aging.toISOString())).toBe('aging');
  });

  it('returns stale for dates > 365 days ago', () => {
    expect(getFreshnessLevel('2020-01-01T00:00:00Z')).toBe('stale');
  });
});

describe('getRecencyMultiplier', () => {
  it('fresh = 1.0', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    expect(getRecencyMultiplier(recent.toISOString())).toBe(1.0);
  });

  it('aging = 0.85', () => {
    const aging = new Date();
    aging.setDate(aging.getDate() - 200);
    expect(getRecencyMultiplier(aging.toISOString())).toBe(0.85);
  });

  it('stale = 0.7', () => {
    expect(getRecencyMultiplier('2020-01-01T00:00:00Z')).toBe(0.7);
  });
});

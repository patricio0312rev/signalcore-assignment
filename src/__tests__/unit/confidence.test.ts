import { describe, it, expect } from 'vitest';
import { calculateConfidence } from '@/lib/scoring/confidence';
import type { Evidence } from '@/lib/scoring/types';

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: 'e1',
    vendorId: 'langsmith',
    requirementId: 'tracing',
    claim: 'Test',
    snippet: 'Test',
    sourceUrl: 'https://example.com',
    sourceType: 'official',
    strength: 'strong',
    publishedAt: new Date().toISOString(),
    capturedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('calculateConfidence', () => {
  it('returns high when 3+ items including at least one official source with fresh evidence', () => {
    const evidence = [
      makeEvidence({ id: 'e1', sourceType: 'official' }),
      makeEvidence({ id: 'e2', sourceType: 'github' }),
      makeEvidence({ id: 'e3', sourceType: 'blog' }),
    ];
    expect(calculateConfidence(evidence)).toBe('high');
  });

  it('returns medium when 2 items with mixed sources', () => {
    const evidence = [
      makeEvidence({ id: 'e1', sourceType: 'github' }),
      makeEvidence({ id: 'e2', sourceType: 'blog' }),
    ];
    expect(calculateConfidence(evidence)).toBe('medium');
  });

  it('returns low when fewer than 2 evidence items', () => {
    expect(calculateConfidence([])).toBe('low');
    expect(calculateConfidence([makeEvidence()])).toBe('low');
  });

  it('returns low when all evidence is stale', () => {
    const staleDate = '2020-01-01T00:00:00Z';
    const evidence = [
      makeEvidence({ id: 'e1', publishedAt: staleDate }),
      makeEvidence({ id: 'e2', publishedAt: staleDate }),
      makeEvidence({ id: 'e3', sourceType: 'official', publishedAt: staleDate }),
    ];
    expect(calculateConfidence(evidence)).toBe('low');
  });
});

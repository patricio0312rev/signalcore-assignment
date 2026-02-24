import { describe, it, expect } from 'vitest';
import { calculateRequirementScore, calculateScore } from '@/lib/scoring/engine';
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

describe('Scoring Consistency', () => {
  it('more official evidence → higher score than community-only', () => {
    const official = [
      makeEvidence({ id: 'e1', sourceType: 'official' }),
      makeEvidence({ id: 'e2', sourceType: 'official' }),
    ];
    const community = [
      makeEvidence({ id: 'e3', sourceType: 'community' }),
      makeEvidence({ id: 'e4', sourceType: 'community' }),
    ];

    expect(calculateRequirementScore(official)).toBeGreaterThan(
      calculateRequirementScore(community)
    );
  });

  it('same evidence set → identical score every time', () => {
    const evidence = [
      makeEvidence({ id: 'e1', sourceType: 'official' }),
      makeEvidence({ id: 'e2', sourceType: 'github', strength: 'moderate' }),
    ];

    const scores = Array.from({ length: 5 }, () => calculateRequirementScore(evidence));
    expect(new Set(scores).size).toBe(1);
  });

  it('removing evidence decreases evidence count and lowers confidence', () => {
    const fullEvidence = [
      makeEvidence({ id: 'e1', vendorId: 'v1', requirementId: 'r1', sourceType: 'official' }),
      makeEvidence({ id: 'e2', vendorId: 'v1', requirementId: 'r1', sourceType: 'github' }),
      makeEvidence({ id: 'e3', vendorId: 'v1', requirementId: 'r1', sourceType: 'blog' }),
    ];
    const partialEvidence = [fullEvidence[0]];

    const fullScore = calculateScore('v1', 'r1', fullEvidence);
    const partialScore = calculateScore('v1', 'r1', partialEvidence);

    expect(fullScore.evidenceCount).toBeGreaterThan(partialScore.evidenceCount);
    expect(fullScore.confidence).toBe('high');
    expect(partialScore.confidence).toBe('low');
  });

  it('fresh evidence scores higher than stale for same claim', () => {
    const fresh = [makeEvidence({ publishedAt: new Date().toISOString() })];
    const stale = [makeEvidence({ publishedAt: '2020-01-01T00:00:00Z' })];

    expect(calculateRequirementScore(fresh)).toBeGreaterThan(
      calculateRequirementScore(stale)
    );
  });

  it('no evidence → score 0 + confidence low', () => {
    const result = calculateScore('langsmith', 'tracing', []);
    expect(result.score).toBe(0);
    expect(result.confidence).toBe('low');
  });
});

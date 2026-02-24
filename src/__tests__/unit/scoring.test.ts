import { describe, it, expect } from 'vitest';
import { calculateRequirementScore, calculateScore, calculateVendorScores } from '@/lib/scoring/engine';
import type { Evidence, Vendor, Requirement } from '@/lib/scoring/types';

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: 'e1',
    vendorId: 'langsmith',
    requirementId: 'framework-agnostic',
    claim: 'Test claim',
    snippet: 'Test snippet',
    sourceUrl: 'https://example.com',
    sourceType: 'official',
    strength: 'strong',
    publishedAt: new Date().toISOString(),
    capturedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('calculateRequirementScore', () => {
  it('returns 0 for empty evidence', () => {
    expect(calculateRequirementScore([])).toBe(0);
  });

  it('returns higher score for official docs vs community', () => {
    const official = [makeEvidence({ sourceType: 'official' })];
    const community = [makeEvidence({ sourceType: 'community' })];

    expect(calculateRequirementScore(official)).toBeGreaterThan(
      calculateRequirementScore(community)
    );
  });

  it('returns higher score for strong vs weak strength', () => {
    const strong = [makeEvidence({ strength: 'strong' })];
    const weak = [makeEvidence({ strength: 'weak' })];

    expect(calculateRequirementScore(strong)).toBeGreaterThan(
      calculateRequirementScore(weak)
    );
  });

  it('applies recency multiplier — fresh > stale', () => {
    const fresh = [makeEvidence({ publishedAt: new Date().toISOString() })];
    const stale = [makeEvidence({ publishedAt: '2020-01-01T00:00:00Z' })];

    expect(calculateRequirementScore(fresh)).toBeGreaterThan(
      calculateRequirementScore(stale)
    );
  });

  it('is deterministic — same input produces same output', () => {
    const evidence = [
      makeEvidence({ sourceType: 'official', strength: 'strong' }),
      makeEvidence({ id: 'e2', sourceType: 'github', strength: 'moderate' }),
    ];

    const score1 = calculateRequirementScore(evidence);
    const score2 = calculateRequirementScore(evidence);
    expect(score1).toBe(score2);
  });

  it('caps score at 10', () => {
    const evidence = [makeEvidence({ sourceType: 'official', strength: 'strong' })];
    expect(calculateRequirementScore(evidence)).toBeLessThanOrEqual(10);
  });
});

describe('calculateScore', () => {
  it('returns score 0 and confidence low for missing evidence', () => {
    const result = calculateScore('langsmith', 'framework-agnostic', []);
    expect(result.score).toBe(0);
    expect(result.confidence).toBe('low');
    expect(result.evidenceCount).toBe(0);
  });

  it('filters evidence by vendor and requirement', () => {
    const evidence = [
      makeEvidence({ vendorId: 'langsmith', requirementId: 'framework-agnostic' }),
      makeEvidence({ id: 'e2', vendorId: 'langfuse', requirementId: 'framework-agnostic' }),
      makeEvidence({ id: 'e3', vendorId: 'langsmith', requirementId: 'eval-framework' }),
    ];

    const result = calculateScore('langsmith', 'framework-agnostic', evidence);
    expect(result.evidenceCount).toBe(1);
  });
});

describe('calculateVendorScores', () => {
  const vendors: Vendor[] = [
    { id: 'v1', name: 'Vendor A', description: '', website: '', color: 'chart-1' },
    { id: 'v2', name: 'Vendor B', description: '', website: '', color: 'chart-2' },
  ];

  const requirements: Requirement[] = [
    { id: 'r1', name: 'Req 1', description: '', priority: 'high' },
    { id: 'r2', name: 'Req 2', description: '', priority: 'low' },
  ];

  it('ranks vendors by total weighted score (descending)', () => {
    const evidence: Evidence[] = [
      makeEvidence({ vendorId: 'v1', requirementId: 'r1', sourceType: 'official' }),
      makeEvidence({ id: 'e2', vendorId: 'v1', requirementId: 'r2', sourceType: 'official' }),
      makeEvidence({ id: 'e3', vendorId: 'v2', requirementId: 'r1', sourceType: 'community' }),
    ];

    const result = calculateVendorScores(vendors, requirements, evidence);
    expect(result[0].vendor.id).toBe('v1');
    expect(result[0].totalScore).toBeGreaterThan(result[1].totalScore);
  });

  it('applies priority weights — high priority matters more', () => {
    const evidence: Evidence[] = [
      makeEvidence({ vendorId: 'v1', requirementId: 'r1', sourceType: 'community', strength: 'weak' }),
      makeEvidence({ id: 'e2', vendorId: 'v2', requirementId: 'r2', sourceType: 'official', strength: 'strong' }),
    ];

    const result = calculateVendorScores(vendors, requirements, evidence);
    // v1: community(0.4) * weak(0.4) * fresh(1.0) = 0.16 → normalized * 10 = 1.6 on high(3) req
    // v2: official(1.0) * strong(1.0) * fresh(1.0) = 1.0 → normalized * 10 = 10 on low(1) req
    // v1 weighted: (1.6*3 + 0*1)/(3+1) = 1.2
    // v2 weighted: (0*3 + 10*1)/(3+1) = 2.5
    expect(result).toHaveLength(2);
    expect(result[0].vendor.id).toBe('v2');
    expect(result[0].totalScore).toBeGreaterThan(result[1].totalScore);
  });
});

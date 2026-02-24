import type {
  Evidence,
  Score,
  Vendor,
  Requirement,
  VendorScore,
  ConfidenceLevel,
} from '@/lib/scoring/types';
import { SOURCE_TYPE_WEIGHTS, STRENGTH_MULTIPLIERS, PRIORITY_WEIGHTS } from './weights';
import { getFreshnessLevel, getRecencyMultiplier } from '@/lib/utils/freshness';
import { calculateConfidence } from './confidence';

export function calculateRequirementScore(evidence: Evidence[]): number {
  if (evidence.length === 0) return 0;

  const totalWeight = evidence.reduce((sum, item) => {
    const sourceWeight = SOURCE_TYPE_WEIGHTS[item.sourceType];
    const strengthMultiplier = STRENGTH_MULTIPLIERS[item.strength];
    const recencyMultiplier = getRecencyMultiplier(item.publishedAt);

    return sum + sourceWeight * strengthMultiplier * recencyMultiplier;
  }, 0);

  const normalized = (totalWeight / evidence.length) * 10;

  return Math.min(normalized, 10);
}

export function calculateScore(
  vendorId: string,
  requirementId: string,
  allEvidence: Evidence[]
): Score {
  const filtered = allEvidence.filter(
    (e) => e.vendorId === vendorId && e.requirementId === requirementId
  );

  const score = calculateRequirementScore(filtered);
  const confidence = calculateConfidence(filtered);

  const freshestLevel =
    filtered.length === 0
      ? 'stale' as const
      : filtered.reduce<ReturnType<typeof getFreshnessLevel>>(
          (best, e) => {
            const level = getFreshnessLevel(e.publishedAt);
            const order = { fresh: 0, aging: 1, stale: 2 };
            return order[level] < order[best] ? level : best;
          },
          'stale'
        );

  return {
    vendorId,
    requirementId,
    score: Math.round(score * 100) / 100,
    confidence,
    evidenceCount: filtered.length,
    freshnessLevel: freshestLevel,
  };
}

export function calculateVendorScores(
  vendors: Vendor[],
  requirements: Requirement[],
  evidence: Evidence[]
): VendorScore[] {
  const vendorScores: VendorScore[] = vendors.map((vendor) => {
    const scores = requirements.map((req) =>
      calculateScore(vendor.id, req.id, evidence)
    );

    const totalPriorityWeight = requirements.reduce(
      (sum, req) => sum + PRIORITY_WEIGHTS[req.priority],
      0
    );

    const weightedSum = scores.reduce((sum, score, index) => {
      const priority = requirements[index].priority;
      return sum + score.score * PRIORITY_WEIGHTS[priority];
    }, 0);

    const totalScore =
      totalPriorityWeight > 0
        ? Math.round((weightedSum / totalPriorityWeight) * 100) / 100
        : 0;

    const confidenceLevels = scores.map((s) => s.confidence);
    const confidence = aggregateConfidence(confidenceLevels);

    return {
      vendor,
      totalScore,
      confidence,
      scores,
    };
  });

  return vendorScores.sort((a, b) => b.totalScore - a.totalScore);
}

function aggregateConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  if (levels.length === 0) return 'low';

  const order: Record<ConfidenceLevel, number> = { high: 2, medium: 1, low: 0 };
  const avg = levels.reduce((sum, l) => sum + order[l], 0) / levels.length;

  if (avg >= 1.5) return 'high';
  if (avg >= 0.5) return 'medium';
  return 'low';
}

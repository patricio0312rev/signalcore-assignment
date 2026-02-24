import type { VendorScore, ConfidenceLevel } from '@/lib/scoring/types';

function aggregateConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  if (levels.length === 0) return 'low';

  const order: Record<ConfidenceLevel, number> = { high: 2, medium: 1, low: 0 };
  const avg = levels.reduce((sum, l) => sum + order[l], 0) / levels.length;

  if (avg >= 1.5) return 'high';
  if (avg >= 0.5) return 'medium';
  return 'low';
}

export function recalculateWithWeights(
  vendorScores: VendorScore[],
  customWeights: Record<string, number>
): VendorScore[] {
  const recalculated = vendorScores.map((vs) => {
    const totalPriorityWeight = vs.scores.reduce(
      (sum, s) => sum + (customWeights[s.requirementId] ?? 1),
      0
    );

    const weightedSum = vs.scores.reduce(
      (sum, s) => sum + s.score * (customWeights[s.requirementId] ?? 1),
      0
    );

    const totalScore =
      totalPriorityWeight > 0
        ? Math.round((weightedSum / totalPriorityWeight) * 100) / 100
        : 0;

    const confidence = aggregateConfidence(vs.scores.map((s) => s.confidence));

    return { ...vs, totalScore, confidence };
  });

  return recalculated.sort((a, b) => b.totalScore - a.totalScore);
}

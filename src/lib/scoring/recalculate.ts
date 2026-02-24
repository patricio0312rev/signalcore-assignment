import type { VendorScore } from '@/lib/scoring/types';

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

    return { ...vs, totalScore };
  });

  return recalculated.sort((a, b) => b.totalScore - a.totalScore);
}

import type { Evidence, ConfidenceLevel } from '@/lib/scoring/types';
import { getFreshnessLevel } from '@/lib/utils/freshness';

export function calculateConfidence(evidence: Evidence[]): ConfidenceLevel {
  if (evidence.length === 0) {
    return 'low';
  }

  const hasOfficialSource = evidence.some(
    (e) => e.sourceType === 'official'
  );
  const hasStrongEvidence = evidence.some(
    (e) => e.strength === 'strong'
  );
  const hasFreshItem = evidence.some(
    (e) => getFreshnessLevel(e.publishedAt) === 'fresh'
  );
  const allStale = evidence.every(
    (e) => getFreshnessLevel(e.publishedAt) === 'stale'
  );

  if (allStale) {
    return 'low';
  }

  if (evidence.length >= 2 && hasOfficialSource && hasFreshItem) {
    return 'high';
  }

  if (hasOfficialSource && hasFreshItem && hasStrongEvidence) {
    return 'high';
  }

  if (hasOfficialSource || hasFreshItem) {
    return 'medium';
  }

  return 'low';
}

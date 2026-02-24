import type { Evidence, ConfidenceLevel } from '@/lib/scoring/types';
import { getFreshnessLevel } from '@/lib/utils/freshness';

export function calculateConfidence(evidence: Evidence[]): ConfidenceLevel {
  if (evidence.length < 2) {
    return 'low';
  }

  const hasOfficialSource = evidence.some(
    (e) => e.sourceType === 'official'
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

  if (evidence.length >= 3 && hasOfficialSource && hasFreshItem) {
    return 'high';
  }

  if (evidence.length >= 2 || hasOfficialSource) {
    return 'medium';
  }

  return 'low';
}

'use client';

import { useMemo } from 'react';
import type { ResearchSummaryProps } from './types';
import type { ResearchEvent } from '@/lib/research/types';

export function ResearchSummary({ events, startedAt, completedAt }: ResearchSummaryProps) {
  const stats = useMemo(() => {
    let totalSources = 0;
    let totalEvidence = 0;

    for (const event of events) {
      if (event.type === 'source_fetched' && event.status === 'success') {
        totalSources++;
      }
      if (event.type === 'session_complete') {
        totalEvidence = event.totalEvidence;
      }
    }

    let durationSeconds: number | null = null;
    const sessionComplete = events.find(
      (e): e is Extract<ResearchEvent, { type: 'session_complete' }> =>
        e.type === 'session_complete'
    );

    if (sessionComplete) {
      durationSeconds = sessionComplete.duration / 1000;
    } else if (startedAt && completedAt) {
      durationSeconds =
        (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000;
    }

    return { totalSources, totalEvidence, durationSeconds };
  }, [events, startedAt, completedAt]);

  return (
    <p className="text-sm text-muted-foreground">
      Fetched {stats.totalSources} sources, extracted {stats.totalEvidence} evidence
      items
      {stats.durationSeconds !== null && (
        <> in {stats.durationSeconds.toFixed(1)}s</>
      )}
    </p>
  );
}

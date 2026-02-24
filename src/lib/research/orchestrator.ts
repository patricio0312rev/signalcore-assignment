import type { ResearchEvent, ResearchSession, ResearchSource } from './types';
import type { StoredSession } from './session-store';
import type { Vendor, Requirement, Evidence } from '@/lib/scoring/types';
import { RESEARCH_SOURCES } from './sources';
import { fetchPage, clearFetchCache } from './fetcher';
import { analyzePageForRequirement } from './analyzer';
import { updateSession } from './session-store';

const CONCURRENCY_LIMIT = 3;

async function pool<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = fn(item).then(() => {
      executing.splice(executing.indexOf(promise), 1);
    });
    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

function strengthRank(strength: Evidence['strength']): number {
  const ranks: Record<Evidence['strength'], number> = {
    strong: 3,
    moderate: 2,
    weak: 1,
  };
  return ranks[strength];
}

function deduplicateEvidence(evidence: Evidence[]): Evidence[] {
  const best = new Map<string, Evidence>();

  for (const item of evidence) {
    const key = `${item.vendorId}-${item.requirementId}`;
    const existing = best.get(key);

    if (!existing || strengthRank(item.strength) > strengthRank(existing.strength)) {
      best.set(key, item);
    }
  }

  return Array.from(best.values());
}

function emitEvent(
  event: ResearchEvent,
  onEvent: (event: ResearchEvent) => void,
  sessionId: string
): void {
  onEvent(event);
  updateSession(sessionId, (session) => ({
    ...session,
    events: [...session.events, event],
  }));
}

export async function runResearch(
  vendors: Vendor[],
  requirements: Requirement[],
  onEvent: (event: ResearchEvent) => void,
  session: ResearchSession
): Promise<Evidence[]> {
  clearFetchCache();

  const startTime = Date.now();
  const allEvidence: Evidence[] = [];

  updateSession(session.id, (s) => ({
    ...s,
    status: 'running',
  }));

  for (const vendor of vendors) {
    emitEvent(
      { type: 'job_started', vendorId: vendor.id, vendorName: vendor.name },
      onEvent,
      session.id
    );

    const vendorSources: ResearchSource[] = RESEARCH_SOURCES.filter(
      (s) => s.vendorId === vendor.id
    );

    updateSession(session.id, (s) => ({
      ...s,
      jobs: [
        ...s.jobs,
        {
          id: `job-${vendor.id}`,
          status: 'fetching',
          vendorId: vendor.id,
          sources: vendorSources,
          fetchedPages: [],
          evidence: [],
          startedAt: new Date().toISOString(),
          completedAt: null,
          error: null,
        },
      ],
    }));

    const fetchedPages: Awaited<ReturnType<typeof fetchPage>>[] = [];

    await pool(vendorSources, CONCURRENCY_LIMIT, async (source) => {
      const page = await fetchPage(source);
      fetchedPages.push(page);

      emitEvent(
        {
          type: 'source_fetched',
          vendorId: vendor.id,
          url: page.url,
          title: page.title,
          status: page.status,
        },
        onEvent,
        session.id
      );
    });

    const successfulPages = fetchedPages.filter((p) => p.status === 'success');
    const vendorEvidence: Evidence[] = [];

    for (const requirement of requirements) {
      let requirementEvidenceCount = 0;

      for (const page of successfulPages) {
        const result = await analyzePageForRequirement(page, requirement, vendor.id);
        vendorEvidence.push(...result.evidence);
        requirementEvidenceCount += result.evidence.length;
      }

      emitEvent(
        {
          type: 'analysis_complete',
          vendorId: vendor.id,
          requirementId: requirement.id,
          evidenceCount: requirementEvidenceCount,
        },
        onEvent,
        session.id
      );
    }

    const deduplicated = deduplicateEvidence(vendorEvidence);
    allEvidence.push(...deduplicated);

    emitEvent(
      {
        type: 'job_complete',
        vendorId: vendor.id,
        totalEvidence: deduplicated.length,
      },
      onEvent,
      session.id
    );

    updateSession(session.id, (s) => ({
      ...s,
      jobs: s.jobs.map((j) =>
        j.vendorId === vendor.id
          ? {
              ...j,
              status: 'complete' as const,
              fetchedPages,
              evidence: deduplicated,
              completedAt: new Date().toISOString(),
            }
          : j
      ),
    }));
  }

  const duration = Date.now() - startTime;

  emitEvent(
    {
      type: 'session_complete',
      totalEvidence: allEvidence.length,
      duration,
    },
    onEvent,
    session.id
  );

  updateSession(session.id, (s: StoredSession) => ({
    ...s,
    status: 'complete',
    completedAt: new Date().toISOString(),
  }));

  return allEvidence;
}

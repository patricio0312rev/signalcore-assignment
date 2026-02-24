import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeMock } from '@/lib/research/mock-analyzer';
import type { FetchedPage } from '@/lib/research/types';
import type { Requirement, SourceType } from '@/lib/scoring/types';

vi.useFakeTimers();

function makePage(vendorId: string, sourceType: SourceType = 'official'): FetchedPage {
  return {
    url: 'https://example.com/docs',
    text: 'Some documentation text',
    title: 'Test Page',
    publishedAt: '2026-01-15',
    fetchedAt: new Date().toISOString(),
    sourceType,
    vendorId,
    status: 'success',
  };
}

function makeRequirement(id: string): Requirement {
  return {
    id,
    name: id.replace(/-/g, ' '),
    description: `Requirement for ${id}`,
    priority: 'high',
  };
}

async function runAnalyzeMock(
  page: FetchedPage,
  requirement: Requirement,
  vendorId: string
) {
  const promise = analyzeMock(page, requirement, vendorId);
  await vi.runAllTimersAsync();
  return promise;
}

describe('analyzeMock', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('returns evidence for known vendor-requirement pair (langfuse + self-hosting)', async () => {
    const page = makePage('langfuse', 'official');
    const requirement = makeRequirement('self-hosting');

    const result = await runAnalyzeMock(page, requirement, 'langfuse');

    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.reasoning).not.toBe('No relevant evidence found');
  });

  it('returns empty evidence for unknown combination', async () => {
    const page = makePage('unknown-vendor');
    const requirement = makeRequirement('nonexistent-req');

    const result = await runAnalyzeMock(page, requirement, 'unknown-vendor');

    expect(result.evidence).toEqual([]);
    expect(result.reasoning).toBe('No relevant evidence found');
  });

  it('generates evidence IDs matching format ev-{vendorId}-{reqId}-{N}', async () => {
    const page = makePage('langfuse', 'official');
    const requirement = makeRequirement('self-hosting');

    const result = await runAnalyzeMock(page, requirement, 'langfuse');

    for (let i = 0; i < result.evidence.length; i++) {
      expect(result.evidence[i].id).toBe(`ev-langfuse-self-hosting-${i}`);
    }
  });

  it('evidence items have all required fields', async () => {
    const page = makePage('braintrust', 'official');
    const requirement = makeRequirement('eval-framework');

    const result = await runAnalyzeMock(page, requirement, 'braintrust');

    for (const ev of result.evidence) {
      expect(ev).toHaveProperty('id');
      expect(ev).toHaveProperty('vendorId', 'braintrust');
      expect(ev).toHaveProperty('requirementId', 'eval-framework');
      expect(ev).toHaveProperty('claim');
      expect(typeof ev.claim).toBe('string');
      expect(ev.claim.length).toBeGreaterThan(0);
      expect(ev).toHaveProperty('snippet');
      expect(typeof ev.snippet).toBe('string');
      expect(ev).toHaveProperty('sourceUrl');
      expect(ev).toHaveProperty('sourceType');
      expect(['official', 'github', 'blog', 'community']).toContain(ev.sourceType);
      expect(ev).toHaveProperty('strength');
      expect(['strong', 'moderate', 'weak']).toContain(ev.strength);
      expect(ev).toHaveProperty('publishedAt');
      expect(ev).toHaveProperty('capturedAt');
    }
  });

  it('evidence sourceUrl matches the page URL passed in', async () => {
    const page = makePage('langsmith', 'official');
    page.url = 'https://docs.smith.langchain.com/evaluation';
    const requirement = makeRequirement('eval-framework');

    const result = await runAnalyzeMock(page, requirement, 'langsmith');

    for (const ev of result.evidence) {
      expect(ev.sourceUrl).toBe('https://docs.smith.langchain.com/evaluation');
    }
  });

  it('uses page publishedAt for evidence publishedAt', async () => {
    const page = makePage('langfuse', 'official');
    page.publishedAt = '2025-12-01T00:00:00Z';
    const requirement = makeRequirement('self-hosting');

    const result = await runAnalyzeMock(page, requirement, 'langfuse');

    for (const ev of result.evidence) {
      expect(ev.publishedAt).toBe('2025-12-01T00:00:00Z');
    }
  });

  it('uses page fetchedAt for evidence capturedAt', async () => {
    const page = makePage('langfuse', 'official');
    const requirement = makeRequirement('self-hosting');

    const result = await runAnalyzeMock(page, requirement, 'langfuse');

    for (const ev of result.evidence) {
      expect(ev.capturedAt).toBe(page.fetchedAt);
    }
  });

  it('filters responses by matching sourceType when available', async () => {
    const page = makePage('langsmith', 'github');
    const requirement = makeRequirement('framework-agnostic');

    const result = await runAnalyzeMock(page, requirement, 'langsmith');

    for (const ev of result.evidence) {
      expect(ev.sourceType).toBe('github');
    }
  });

  it('falls back to first response when no sourceType matches', async () => {
    const page = makePage('langsmith', 'blog');
    const requirement = makeRequirement('self-hosting');

    const result = await runAnalyzeMock(page, requirement, 'langsmith');

    // langsmith-self-hosting has official and github, not blog
    // Should fall back to first response
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  describe('all 24 vendor-requirement pairs return evidence', () => {
    const vendorIds = ['langsmith', 'langfuse', 'braintrust', 'posthog'];
    const requirementIds = [
      'framework-agnostic',
      'self-hosting',
      'eval-framework',
      'opentelemetry',
      'prompt-management',
      'pricing',
    ];

    for (const vendorId of vendorIds) {
      for (const reqId of requirementIds) {
        it(`${vendorId} + ${reqId} returns at least 1 evidence item`, async () => {
          const page = makePage(vendorId, 'official');
          const requirement = makeRequirement(reqId);

          const result = await runAnalyzeMock(page, requirement, vendorId);

          expect(
            result.evidence.length,
            `Expected evidence for ${vendorId}-${reqId}`
          ).toBeGreaterThanOrEqual(1);
        });
      }
    }
  });
});

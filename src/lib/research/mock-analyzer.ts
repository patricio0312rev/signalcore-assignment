import type { FetchedPage, AnalyzerResult } from './types';
import type { Evidence, Requirement } from '@/lib/scoring/types';
import { MOCK_RESPONSES } from './mock-responses';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLatency(): number {
  return Math.floor(Math.random() * 1200) + 800;
}

export async function analyzeMock(
  page: FetchedPage,
  requirement: Requirement,
  vendorId: string
): Promise<AnalyzerResult> {
  await delay(randomLatency());

  const key = `${vendorId}-${requirement.id}`;
  const responses = MOCK_RESPONSES[key];

  if (!responses || responses.length === 0) {
    return {
      evidence: [],
      reasoning: 'No relevant evidence found',
    };
  }

  const matchingResponses = responses.filter(
    (r) => r.sourceType === page.sourceType
  );

  const selectedResponses =
    matchingResponses.length > 0 ? matchingResponses : [responses[0]];

  const evidence: Evidence[] = selectedResponses.map((response, index) => ({
    id: `ev-${vendorId}-${requirement.id}-${index}`,
    vendorId,
    requirementId: requirement.id,
    claim: response.claim,
    snippet: response.snippet,
    sourceUrl: page.url,
    sourceType: response.sourceType,
    strength: response.strength,
    publishedAt: page.publishedAt ?? new Date().toISOString(),
    capturedAt: page.fetchedAt,
  }));

  const reasoning = selectedResponses
    .map((r) => r.reasoning)
    .join(' ');

  return {
    evidence,
    reasoning,
  };
}

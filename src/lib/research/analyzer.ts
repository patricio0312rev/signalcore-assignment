import type { FetchedPage, AnalyzerResult } from './types';
import type { Requirement } from '@/lib/scoring/types';
import { getResearchMode } from './config';
import { analyzeMock } from './mock-analyzer';

export async function analyzePageForRequirement(
  page: FetchedPage,
  requirement: Requirement,
  vendorId: string
): Promise<AnalyzerResult> {
  const mode = getResearchMode();

  if (mode === 'live') {
    // In live mode, would call LLM API with prompts from prompts.ts
    // For now, fall back to mock
    return analyzeMock(page, requirement, vendorId);
  }

  return analyzeMock(page, requirement, vendorId);
}

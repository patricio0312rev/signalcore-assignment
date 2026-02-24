import { describe, it, expect } from 'vitest';
import { matchScenario, getFallbackResponse } from '@/lib/chat/matcher';
import type { ChatScenario } from '@/lib/scoring/types';
import scenariosData from '@/data/chat-scenarios.json';

const scenarios = scenariosData as ChatScenario[];

describe('Prompt Regression — scenario matching', () => {
  it('"data sovereignty" recommends Langfuse', () => {
    const result = matchScenario('We need data sovereignty for our LLM traces', scenarios);
    expect(result).not.toBeNull();
    expect(result!.recommendedVendorId).toBe('langfuse');
  });

  it('"LangChain ecosystem" recommends LangSmith', () => {
    const result = matchScenario('We use LangChain and LCEL extensively', scenarios);
    expect(result).not.toBeNull();
    expect(result!.recommendedVendorId).toBe('langsmith');
  });

  it('"budget constraint" mentions open-source options', () => {
    const result = matchScenario('Budget is our main constraint, need something affordable', scenarios);
    expect(result).not.toBeNull();
    expect(result!.response.toLowerCase()).toContain('open-source');
  });

  it('"evaluation" recommends Braintrust', () => {
    const result = matchScenario('Best evaluation framework for LLM testing?', scenarios);
    expect(result).not.toBeNull();
    expect(result!.recommendedVendorId).toBe('braintrust');
  });

  it('fallback response includes topic suggestions', () => {
    const fallback = getFallbackResponse();
    expect(fallback).toContain('Data sovereignty');
    expect(fallback).toContain('Budget constraints');
  });
});

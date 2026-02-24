import { describe, it, expect } from 'vitest';
import type { ChatScenario } from '@/lib/scoring/types';
import scenariosData from '@/data/chat-scenarios.json';

const scenarios = scenariosData as ChatScenario[];

describe('Response Quality', () => {
  it('every response is between 50 and 1000 characters', () => {
    for (const scenario of scenarios) {
      const len = scenario.response.length;
      expect(len, `Scenario "${scenario.id}" too short (${len} chars)`).toBeGreaterThanOrEqual(50);
      expect(len, `Scenario "${scenario.id}" too long (${len} chars)`).toBeLessThanOrEqual(1000);
    }
  });

  it('responses mention trade-offs (not just the winner)', () => {
    for (const scenario of scenarios) {
      // Each response should mention at least 2 vendors (comparing)
      const vendorMentions = ['LangSmith', 'Langfuse', 'Braintrust', 'PostHog'].filter((v) =>
        scenario.response.includes(v)
      );
      expect(
        vendorMentions.length,
        `Scenario "${scenario.id}" only mentions ${vendorMentions.length} vendor(s)`
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it('reasoning has at least 3 bullet points per scenario', () => {
    for (const scenario of scenarios) {
      expect(
        scenario.reasoning.length,
        `Scenario "${scenario.id}" has only ${scenario.reasoning.length} reasoning items`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('each scenario has a match score between 0 and 1', () => {
    for (const scenario of scenarios) {
      expect(scenario.matchScore).toBeGreaterThanOrEqual(0);
      expect(scenario.matchScore).toBeLessThanOrEqual(1);
    }
  });

  it('all scenarios have unique IDs', () => {
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

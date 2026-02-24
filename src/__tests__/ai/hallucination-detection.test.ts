import { describe, it, expect } from 'vitest';
import { matchScenario, getFallbackResponse } from '@/lib/chat/matcher';
import type { ChatScenario } from '@/lib/scoring/types';
import scenariosData from '@/data/chat-scenarios.json';
import vendorsData from '@/data/vendors.json';

const scenarios = scenariosData as ChatScenario[];
const validVendorIds = new Set(vendorsData.map((v) => v.id));

describe('Hallucination Detection', () => {
  it('all recommendedVendorIds reference vendors in vendors.json', () => {
    for (const scenario of scenarios) {
      if (scenario.recommendedVendorId !== null) {
        expect(
          validVendorIds.has(scenario.recommendedVendorId),
          `Scenario "${scenario.id}" recommends unknown vendor: ${scenario.recommendedVendorId}`
        ).toBe(true);
      }
    }
  });

  it('every scenario response mentions at least one known vendor by name', () => {
    const vendorNames = vendorsData.map((v) => v.name.toLowerCase());

    for (const scenario of scenarios) {
      const responseLower = scenario.response.toLowerCase();
      const mentionsVendor = vendorNames.some((name) => responseLower.includes(name));
      expect(
        mentionsVendor,
        `Scenario "${scenario.id}" response doesn't mention any known vendor`
      ).toBe(true);
    }
  });

  it('no scenario claims features without reasoning', () => {
    for (const scenario of scenarios) {
      expect(
        scenario.reasoning.length,
        `Scenario "${scenario.id}" has no reasoning`
      ).toBeGreaterThan(0);
    }
  });

  it('fallback response does not recommend any specific vendor', () => {
    const fallback = getFallbackResponse();
    const vendorNames = vendorsData.map((v) => v.name);
    for (const name of vendorNames) {
      expect(fallback, `Fallback should not mention "${name}"`).not.toContain(name);
    }
    expect(fallback).not.toContain('best choice');
  });

  it('unmatched queries return fallback, not a fabricated response', () => {
    const result = matchScenario('tell me about quantum computing', scenarios);
    expect(result).toBeNull();
  });
});

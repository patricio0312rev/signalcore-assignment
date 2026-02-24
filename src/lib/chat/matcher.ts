import type { ChatScenario } from '@/lib/scoring/types';

interface MatchResult {
  scenario: ChatScenario;
  score: number;
}

export function matchScenario(
  input: string,
  scenarios: ChatScenario[]
): ChatScenario | null {
  const normalized = input.toLowerCase().trim();

  if (normalized.length === 0) return null;

  const results: MatchResult[] = [];

  for (const scenario of scenarios) {
    let score = 0;

    for (const keyword of scenario.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length;
      }
    }

    if (score > 0) {
      results.push({ scenario, score });
    }
  }

  if (results.length === 0) return null;

  results.sort((a, b) => b.score - a.score);

  return results[0].scenario;
}

export function getFallbackResponse(): string {
  return "I don't have a specific recommendation for that query. Try asking about:\n\n- **Data sovereignty** or self-hosting needs\n- **LangChain ecosystem** integration\n- **Budget constraints** and pricing\n- **Evaluation frameworks** comparison\n- **OpenTelemetry** support\n- **High-volume** trace pricing\n- **Agent tracing** capabilities\n- **Prompt versioning** features";
}

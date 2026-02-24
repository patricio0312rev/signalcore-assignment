export type ResearchMode = 'simulated' | 'live';

export function getResearchMode(): ResearchMode {
  const mode = process.env.RESEARCH_MODE || 'simulated';
  if (mode !== 'simulated' && mode !== 'live') return 'simulated';
  return mode;
}

export function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

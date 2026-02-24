import { NextResponse } from 'next/server';
import type { ChatScenario } from '@/lib/scoring/types';
import { matchScenario, getFallbackResponse } from '@/lib/chat/matcher';
import scenariosData from '@/data/chat-scenarios.json';

export async function POST(request: Request) {
  const { message } = (await request.json()) as { message: string };

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const scenarios = scenariosData as ChatScenario[];
  const matched = matchScenario(message, scenarios);

  if (matched) {
    return NextResponse.json({
      response: matched.response,
      recommendedVendorId: matched.recommendedVendorId,
      reasoning: matched.reasoning,
      scenarioId: matched.id,
    });
  }

  return NextResponse.json({
    response: getFallbackResponse(),
    recommendedVendorId: null,
    reasoning: [],
    scenarioId: null,
  });
}

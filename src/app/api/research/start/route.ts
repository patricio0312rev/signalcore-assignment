import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { createSession } from '@/lib/research/session-store';
import { runResearch } from '@/lib/research/orchestrator';
import vendorsData from '@/data/vendors.json';
import requirementsData from '@/data/requirements.json';
import type { Vendor, Requirement } from '@/lib/scoring/types';

export async function POST(): Promise<NextResponse> {
  const session = createSession();
  const vendors = vendorsData as Vendor[];
  const requirements = requirementsData as Requirement[];

  // Use next/server after() to keep the function alive after responding
  // This ensures the research pipeline completes even in serverless environments
  after(async () => {
    try {
      await runResearch(vendors, requirements, () => {}, session);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[research] Pipeline failed:', message);
    }
  });

  return NextResponse.json({ sessionId: session.id });
}

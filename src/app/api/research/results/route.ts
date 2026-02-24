import { NextResponse } from 'next/server';
import { getSession } from '@/lib/research/session-store';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId parameter' },
      { status: 400 }
    );
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  if (session.status !== 'complete') {
    return NextResponse.json(
      { error: 'Research is not complete yet', status: session.status },
      { status: 409 }
    );
  }

  const allEvidence = session.jobs.flatMap((job) => job.evidence);
  const totalSources = session.jobs.reduce(
    (sum, job) => sum + job.fetchedPages.length,
    0
  );

  return NextResponse.json({
    evidence: allEvidence,
    session: {
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      totalSources,
      totalEvidence: allEvidence.length,
    },
  });
}

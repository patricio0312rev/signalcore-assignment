import { getSession } from '@/lib/research/session-store';

const POLL_INTERVAL_MS = 500;
const HEARTBEAT_INTERVAL_MS = 15_000;

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = getSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  let lastSentIndex = 0;
  let lastHeartbeat = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const abortSignal = request.signal;
      let closed = false;

      const safeClose = (): void => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };

      abortSignal.addEventListener('abort', () => safeClose(), { once: true });

      const poll = (): void => {
        if (closed || abortSignal.aborted) {
          safeClose();
          return;
        }

        const currentSession = getSession(sessionId);
        if (!currentSession) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Session expired' })}\n\n`)
          );
          safeClose();
          return;
        }

        // Send any new events
        const newEvents = currentSession.events.slice(lastSentIndex);
        for (const event of newEvents) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          lastSentIndex++;
        }

        // Heartbeat
        const now = Date.now();
        if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
          lastHeartbeat = now;
        }

        // Close when done
        if (currentSession.status === 'complete' || currentSession.status === 'error') {
          safeClose();
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      };

      poll();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Evidence } from '@/lib/scoring/types';
import type { ResearchEvent } from '@/lib/research/types';

interface ResearchState {
  status: 'idle' | 'running' | 'complete' | 'error';
  events: ResearchEvent[];
  evidence: Evidence[] | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

const INITIAL_STATE: ResearchState = {
  status: 'idle',
  events: [],
  evidence: null,
  error: null,
  startedAt: null,
  completedAt: null,
};

export function useResearchSession() {
  const [state, setState] = useState<ResearchState>(INITIAL_STATE);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const fetchResults = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/research/results?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.statusText}`);
      }
      const data = await response.json() as { evidence: Evidence[] };
      setState((prev) => ({
        ...prev,
        evidence: data.evidence,
        status: 'complete',
        completedAt: new Date().toISOString(),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch results';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  }, []);

  const connectSSE = useCallback((sessionId: string) => {
    const es = new EventSource(`/api/research/status?sessionId=${sessionId}`);
    eventSourceRef.current = es;

    es.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data as string) as ResearchEvent;

        setState((prev) => ({
          ...prev,
          events: [...prev.events, parsed],
        }));

        if (parsed.type === 'session_complete') {
          cleanup();
          fetchResults(sessionId);
        }

        if (parsed.type === 'error') {
          cleanup();
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: parsed.message,
          }));
        }
      } catch {
        // Ignore malformed SSE data (e.g. heartbeats)
      }
    };

    es.onerror = () => {
      cleanup();
      setState((prev) => {
        if (prev.status === 'complete' || prev.status === 'error') {
          return prev;
        }
        return {
          ...prev,
          status: 'error',
          error: 'Connection to research pipeline lost',
        };
      });
    };
  }, [cleanup, fetchResults]);

  const startResearch = useCallback(async () => {
    cleanup();

    setState({
      ...INITIAL_STATE,
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    try {
      const response = await fetch('/api/research/start', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Failed to start research: ${response.statusText}`);
      }
      const data = await response.json() as { sessionId: string };
      sessionIdRef.current = data.sessionId;
      connectSSE(data.sessionId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start research';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  }, [cleanup, connectSSE]);

  const isRunning = state.status === 'running';

  return { state, startResearch, isRunning };
}

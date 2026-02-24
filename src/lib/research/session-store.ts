import type { ResearchSession, ResearchEvent } from './types';

export interface StoredSession extends ResearchSession {
  events: ResearchEvent[];
  createdAt: number;
}

const sessions = new Map<string, StoredSession>();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) {
      sessions.delete(id);
    }
  }
}

export function createSession(): StoredSession {
  cleanupExpired();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const session: StoredSession = {
    id,
    status: 'idle',
    jobs: [],
    startedAt: now,
    completedAt: null,
    events: [],
    createdAt: Date.now(),
  };

  sessions.set(id, session);
  return session;
}

export function getSession(id: string): StoredSession | null {
  cleanupExpired();

  const session = sessions.get(id);
  if (!session) {
    return null;
  }

  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(id);
    return null;
  }

  return session;
}

export function updateSession(
  id: string,
  updater: (session: StoredSession) => StoredSession
): void {
  cleanupExpired();

  const session = sessions.get(id);
  if (!session) {
    return;
  }

  const updated = updater(session);
  sessions.set(id, updated);
}

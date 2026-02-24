import type { ResearchSession, ResearchEvent } from './types';

export interface StoredSession extends ResearchSession {
  events: ResearchEvent[];
  createdAt: number;
}

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

// Use globalThis to persist across hot reloads and module instances in dev
const globalKey = '__signalcore_sessions__' as const;
const globalStore = globalThis as unknown as Record<string, Map<string, StoredSession>>;

function getSessions(): Map<string, StoredSession> {
  if (!globalStore[globalKey]) {
    globalStore[globalKey] = new Map<string, StoredSession>();
  }
  return globalStore[globalKey];
}

function cleanupExpired(): void {
  const sessions = getSessions();
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

  getSessions().set(id, session);
  return session;
}

export function getSession(id: string): StoredSession | null {
  cleanupExpired();

  const session = getSessions().get(id);
  if (!session) {
    return null;
  }

  if (Date.now() - session.createdAt > SESSION_TTL) {
    getSessions().delete(id);
    return null;
  }

  return session;
}

export function updateSession(
  id: string,
  updater: (session: StoredSession) => StoredSession
): void {
  cleanupExpired();

  const sessions = getSessions();
  const session = sessions.get(id);
  if (!session) {
    return;
  }

  const updated = updater(session);
  sessions.set(id, updated);
}

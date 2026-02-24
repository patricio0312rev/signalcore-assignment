import type { SourceType, Evidence } from '@/lib/scoring/types';

export interface ResearchSource {
  vendorId: string;
  url: string;
  sourceType: SourceType;
  label: string;
}

export interface FetchedPage {
  url: string;
  text: string;
  title: string;
  publishedAt: string | null;
  fetchedAt: string;
  sourceType: SourceType;
  vendorId: string;
  status: 'success' | 'error';
  error?: string;
}

export interface ResearchJob {
  id: string;
  status: 'pending' | 'fetching' | 'analyzing' | 'complete' | 'error';
  vendorId: string;
  sources: ResearchSource[];
  fetchedPages: FetchedPage[];
  evidence: Evidence[];
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface ResearchSession {
  id: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  jobs: ResearchJob[];
  startedAt: string;
  completedAt: string | null;
}

export type ResearchEvent =
  | { type: 'job_started'; vendorId: string; vendorName: string }
  | { type: 'source_fetched'; vendorId: string; url: string; title: string; status: 'success' | 'error' }
  | { type: 'analysis_complete'; vendorId: string; requirementId: string; evidenceCount: number }
  | { type: 'job_complete'; vendorId: string; totalEvidence: number }
  | { type: 'session_complete'; totalEvidence: number; duration: number }
  | { type: 'error'; message: string };

export interface AnalyzerResult {
  evidence: Evidence[];
  reasoning: string;
}

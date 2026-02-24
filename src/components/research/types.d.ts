import type { Evidence } from '@/lib/scoring/types';
import type { ResearchEvent } from '@/lib/research/types';

export interface ResearchPanelProps {
  onResearchComplete: (evidence: Evidence[]) => void;
}

export interface VendorProgressProps {
  events: ResearchEvent[];
}

export interface VendorStatus {
  vendorId: string;
  vendorName: string;
  state: 'pending' | 'fetching' | 'analyzing' | 'complete';
  sourcesFetched: number;
  evidenceCount: number;
}

export interface VendorProgressItemProps {
  vendor: VendorStatus;
}

export interface EventLogProps {
  events: ResearchEvent[];
}

export interface ResearchSummaryProps {
  events: ResearchEvent[];
  startedAt: string | null;
  completedAt: string | null;
}

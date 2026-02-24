export type Priority = 'high' | 'medium' | 'low';
export type SourceType = 'official' | 'github' | 'blog' | 'community';
export type Strength = 'strong' | 'moderate' | 'weak';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type FreshnessLevel = 'fresh' | 'aging' | 'stale';

export interface Vendor {
  id: string;
  name: string;
  description: string;
  website: string;
  color: string; // tailwind color class for charts
}

export interface Requirement {
  id: string;
  name: string;
  description: string;
  priority: Priority;
}

export interface Evidence {
  id: string;
  vendorId: string;
  requirementId: string;
  claim: string;
  snippet: string;
  sourceUrl: string;
  sourceType: SourceType;
  strength: Strength;
  publishedAt: string; // ISO date
  capturedAt: string; // ISO date
}

export interface Score {
  vendorId: string;
  requirementId: string;
  score: number; // 0-10
  confidence: ConfidenceLevel;
  evidenceCount: number;
  freshnessLevel: FreshnessLevel;
}

export interface VendorScore {
  vendor: Vendor;
  totalScore: number;
  confidence: ConfidenceLevel;
  scores: Score[];
}

export interface ChatScenario {
  id: string;
  keywords: string[];
  question: string;
  response: string;
  recommendedVendorId: string | null;
  matchScore: number;
  reasoning: string[];
}

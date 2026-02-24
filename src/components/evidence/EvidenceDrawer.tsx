'use client';

import { format } from 'date-fns';
import { ShieldCheck, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Evidence, Score } from '@/lib/scoring/types';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { EvidenceCard } from '@/components/evidence/EvidenceCard';

interface EvidenceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorName: string;
  requirementName: string;
  score: Score | null;
  evidence: Evidence[];
}

const confidenceLabels: Record<string, string> = {
  high: 'High Confidence',
  medium: 'Medium Confidence',
  low: 'Low Confidence',
};

const confidenceDescriptions: Record<string, string> = {
  high: 'Based on strong, corroborated evidence',
  medium: 'Based on moderate evidence',
  low: 'Limited evidence available',
};

export function EvidenceDrawer({
  open,
  onOpenChange,
  vendorName,
  requirementName,
  score,
  evidence,
}: EvidenceDrawerProps) {
  const lastUpdated = evidence.length > 0
    ? format(
        new Date(
          Math.max(...evidence.map((e) => new Date(e.capturedAt).getTime()))
        ),
        'MMM d, yyyy'
      )
    : 'N/A';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'max-w-2xl w-full bg-background border-border flex flex-col p-0',
          'sm:max-w-2xl'
        )}
      >
        <SheetTitle className="sr-only">
          {vendorName} x {requirementName} Evidence
        </SheetTitle>
        <SheetDescription className="sr-only">
          Evidence and scoring details for {vendorName} on {requirementName}
        </SheetDescription>

        {/* Header */}
        <div className="border-b border-border p-6 pb-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1.5">
              <ShieldCheck className="size-3" />
              Vendor Verification
            </Badge>
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-foreground">
            {vendorName} x {requirementName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed evidence and scoring breakdown for this vendor-requirement pair.
          </p>
        </div>

        {/* Stat Cards */}
        {score && (
          <div className="grid grid-cols-2 gap-3 px-6 pt-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Match Score
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {score.score}
                </span>
                <span className="text-sm text-muted-foreground">/ 10</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {score.evidenceCount} evidence source{score.evidenceCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Confidence
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {confidenceLabels[score.confidence] ?? score.confidence}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {confidenceDescriptions[score.confidence] ?? ''}
              </p>
            </div>
          </div>
        )}

        {/* Evidence List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Evidence ({evidence.length})
          </h3>
          <div className="flex flex-col gap-3">
            {evidence.map((item) => (
              <EvidenceCard key={item.id} evidence={item} />
            ))}
            {evidence.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No evidence found for this combination.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex items-center gap-3">
          <button
            type="button"
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-lg',
              'bg-primary text-primary-foreground px-4 py-2 text-sm font-medium',
              'transition hover:bg-primary/90 cursor-pointer'
            )}
          >
            <Download className="size-4" />
            Export PDF
          </button>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-lg',
              'border border-border bg-card px-3 py-2 text-sm font-medium',
              'text-foreground transition hover:bg-accent cursor-pointer'
            )}
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

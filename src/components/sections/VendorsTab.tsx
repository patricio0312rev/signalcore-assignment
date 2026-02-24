'use client';

import { ExternalLink, Globe, BarChart3 } from 'lucide-react';
import type { VendorScore, Requirement, Score } from '@/lib/scoring/types';
import { PriorityBadge } from '@/components/matrix/PriorityBadge';
import { ConfidenceBadge } from '@/components/matrix/ConfidenceBadge';

interface VendorsTabProps {
  vendorScores: VendorScore[];
  requirements: Requirement[];
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs font-medium text-foreground w-6 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export function VendorsTab({ vendorScores, requirements }: VendorsTabProps) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendor Profiles</h1>
        <p className="mt-1 text-muted-foreground">
          Detailed breakdown of each vendor&apos;s capabilities and scores.
        </p>
      </div>

      <div className="grid gap-6">
        {vendorScores.map((vs) => (
          <div
            key={vs.vendor.id}
            className="rounded-xl border border-border bg-card"
          >
            {/* Vendor Header */}
            <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-lg font-bold text-primary">
                  {vs.vendor.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">
                    {vs.vendor.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {vs.vendor.description}
                  </p>
                  <a
                    href={vs.vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                  >
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{vs.vendor.website}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:shrink-0">
                <ConfidenceBadge confidence={vs.confidence} />
                <div className="text-right">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Overall
                  </p>
                  <p className="font-mono text-2xl font-bold text-foreground">
                    {vs.totalScore.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Scores Breakdown */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Per-Requirement Scores
                </h3>
              </div>
              <div className="space-y-3">
                {requirements.map((req) => {
                  const score: Score | undefined = vs.scores.find(
                    (s) => s.requirementId === req.id
                  );
                  return (
                    <div key={req.id} className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[180px_1fr] sm:gap-4">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={req.priority} />
                        <span className="text-sm text-foreground truncate">
                          {req.name}
                        </span>
                      </div>
                      {score ? (
                        <ScoreBar score={score.score} />
                      ) : (
                        <span className="text-xs text-muted-foreground">No data</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

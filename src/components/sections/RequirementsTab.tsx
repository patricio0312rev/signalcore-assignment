'use client';

import { ListChecks } from 'lucide-react';
import type { VendorScore, Requirement, Score } from '@/lib/scoring/types';
import { PriorityBadge } from '@/components/matrix/PriorityBadge';
import { cn } from '@/lib/utils';

interface RequirementsTabProps {
  vendorScores: VendorScore[];
  requirements: Requirement[];
}

export function RequirementsTab({ vendorScores, requirements }: RequirementsTabProps) {
  function getScoresForRequirement(reqId: string): Array<{ vendorName: string; score: Score }> {
    return vendorScores
      .map((vs) => {
        const s = vs.scores.find((sc) => sc.requirementId === reqId);
        return s ? { vendorName: vs.vendor.name, score: s } : null;
      })
      .filter(Boolean) as Array<{ vendorName: string; score: Score }>;
  }

  function getAvgScore(reqId: string): number {
    const scores = getScoresForRequirement(reqId);
    if (scores.length === 0) return 0;
    return scores.reduce((sum, s) => sum + s.score.score, 0) / scores.length;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requirements</h1>
        <p className="mt-1 text-muted-foreground">
          Evaluation criteria with aggregated scores across all vendors.
        </p>
      </div>

      <div className="grid gap-4">
        {requirements.map((req) => {
          const vendorBreakdown = getScoresForRequirement(req.id);
          const avg = getAvgScore(req.id);

          return (
            <div
              key={req.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <ListChecks className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {req.name}
                      </h3>
                      <PriorityBadge priority={req.priority} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground max-w-xl">
                      {req.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Avg Score
                  </p>
                  <p className="font-mono text-xl font-bold text-foreground">
                    {avg.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Vendor breakdown */}
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {vendorBreakdown.map(({ vendorName, score }) => (
                  <div
                    key={vendorName}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2"
                  >
                    <span className="text-xs font-medium text-foreground">
                      {vendorName}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-border">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            score.score >= 7
                              ? 'bg-emerald-500'
                              : score.score >= 4
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          )}
                          style={{ width: `${(score.score / 10) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-medium text-foreground w-6 text-right">
                        {score.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorScore } from '@/lib/scoring/types';
import { ConfidenceBadge } from '@/components/matrix/ConfidenceBadge';
import { useAnimatedCounter } from '@/lib/hooks/useAnimatedCounter';

interface VendorScoreCardProps {
  vendorScore: VendorScore;
  rank: number;
}

export function VendorScoreCard({ vendorScore, rank }: VendorScoreCardProps) {
  const { vendor, totalScore, confidence } = vendorScore;
  const initial = vendor.name.charAt(0).toUpperCase();
  const isTopPick = rank === 1;
  const animatedScore = useAnimatedCounter(totalScore);

  return (
    <div
      className={cn(
        'relative bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300',
        isTopPick && 'ring-1 ring-primary/20'
      )}
    >
      {/* Top Pick Badge */}
      {isTopPick && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-white">
            Top Pick
          </span>
        </div>
      )}

      {/* Top Row */}
      <div className="flex items-start justify-between">
        {/* Left: Initial + Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
            {initial}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{vendor.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-muted-foreground">Updated 2h ago</span>
            </div>
          </div>
        </div>

        {/* Right: Confidence */}
        <ConfidenceBadge confidence={confidence} />
      </div>

      {/* Bottom: Score */}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Overall Score
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-foreground">
            {animatedScore}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
          <TrendingUp className="h-3 w-3" />
          +0.4
        </div>
      </div>
    </div>
  );
}

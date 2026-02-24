'use client';

import { cn } from '@/lib/utils';
import type { Score } from '@/lib/scoring/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ScoreCellProps {
  score: Score;
  isHighest: boolean;
  onClick: () => void;
}

export function ScoreCell({ score, isHighest, onClick }: ScoreCellProps) {
  const widthPercent = `${Math.min(100, Math.max(0, score.score * 10))}%`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            data-testid="score-cell"
            onClick={onClick}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer w-full',
              isHighest && 'bg-primary/5'
            )}
          >
            <span
              className={cn(
                'font-mono text-lg font-bold',
                isHighest ? 'text-primary' : 'text-foreground'
              )}
            >
              {score.score.toFixed(1)}
            </span>

            <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  isHighest ? 'bg-primary' : 'bg-muted-foreground/50'
                )}
                style={{ width: widthPercent }}
              />
            </div>

            <span className="text-[10px] text-muted-foreground">
              {score.evidenceCount} sources
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Click to view evidence</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

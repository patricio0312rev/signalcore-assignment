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

const widthByDecile: Record<number, string> = {
  0: 'w-0',
  1: 'w-[10%]',
  2: 'w-[20%]',
  3: 'w-[30%]',
  4: 'w-[40%]',
  5: 'w-[50%]',
  6: 'w-[60%]',
  7: 'w-[70%]',
  8: 'w-[80%]',
  9: 'w-[90%]',
  10: 'w-full',
};

function getBarWidth(score: number): string {
  const decile = Math.min(10, Math.max(0, Math.round(score)));
  return widthByDecile[decile] ?? 'w-0';
}

export function ScoreCell({ score, isHighest, onClick }: ScoreCellProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
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
                  'h-full rounded-full',
                  isHighest ? 'bg-primary' : 'bg-muted-foreground/50',
                  getBarWidth(score.score)
                )}
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

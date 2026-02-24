import { parseISO, differenceInDays, differenceInMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { getFreshnessLevel } from '@/lib/utils/freshness';
import type { FreshnessLevel } from '@/lib/scoring/types';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FreshnessBadgeProps {
  dateStr: string;
}

const dotColorMap: Record<FreshnessLevel, string> = {
  fresh: 'bg-green-500',
  aging: 'bg-yellow-500',
  stale: 'bg-red-500',
};

const textColorMap: Record<FreshnessLevel, string> = {
  fresh: 'text-green-400',
  aging: 'text-yellow-400',
  stale: 'text-red-400',
};

const tooltipMap: Record<FreshnessLevel, string> = {
  fresh: 'Fresh: < 90 days old (weight: 1.0x)',
  aging: 'Aging: 90-365 days old (weight: 0.85x)',
  stale: 'Stale: > 365 days old (weight: 0.7x)',
};

function getFreshnessLabel(dateStr: string, level: FreshnessLevel): string {
  const now = new Date();
  const date = parseISO(dateStr);

  if (level === 'fresh') {
    const days = differenceInDays(now, date);
    return days < 1 ? 'Fresh' : `< 90d`;
  }

  if (level === 'aging') {
    const months = differenceInMonths(now, date);
    return `~${months}mo`;
  }

  return '> 1 year';
}

export function FreshnessBadge({ dateStr }: FreshnessBadgeProps) {
  const level = getFreshnessLevel(dateStr);
  const label = getFreshnessLabel(dateStr, level);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium gap-1.5 cursor-help',
            textColorMap[level]
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', dotColorMap[level])} />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipMap[level]}</TooltipContent>
    </Tooltip>
  );
}

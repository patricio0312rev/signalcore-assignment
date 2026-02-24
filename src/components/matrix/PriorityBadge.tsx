import { cn } from '@/lib/utils';
import type { Priority } from '@/lib/scoring/types';

interface PriorityBadgeProps {
  priority: Priority;
}

const config: Record<Priority, { label: string; className: string }> = {
  high: {
    label: 'P0',
    className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  },
  medium: {
    label: 'P1',
    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
  low: {
    label: 'P2',
    className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, className } = config[priority];

  return (
    <span
      className={cn(
        'text-[10px] font-bold px-1.5 py-0.5 rounded inline-block',
        className
      )}
    >
      {label}
    </span>
  );
}

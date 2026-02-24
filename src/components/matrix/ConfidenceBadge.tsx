import { ShieldCheck, SearchCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfidenceLevel } from '@/lib/scoring/types';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

const config: Record<
  ConfidenceLevel,
  { label: string; icon: typeof ShieldCheck; className: string }
> = {
  high: {
    label: 'High Confidence',
    icon: ShieldCheck,
    className: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
  },
  medium: {
    label: 'Med Confidence',
    icon: SearchCheck,
    className: 'text-amber-400 bg-amber-400/10 border border-amber-400/20',
  },
  low: {
    label: 'Low Confidence',
    icon: AlertTriangle,
    className: 'text-red-400 bg-red-400/10 border border-red-400/20',
  },
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const { label, icon: Icon, className } = config[confidence];

  return (
    <span
      className={cn(
        'px-2 py-1 rounded text-xs font-medium flex items-center gap-1',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

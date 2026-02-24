import { ShieldCheck, Shield, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Strength } from '@/lib/scoring/types';

interface StrengthIndicatorProps {
  strength: Strength;
}

const strengthConfig: Record<
  Strength,
  { label: string; icon: typeof Shield; className: string }
> = {
  strong: {
    label: 'Strong',
    icon: ShieldCheck,
    className: 'text-green-400',
  },
  moderate: {
    label: 'Moderate',
    icon: Shield,
    className: 'text-yellow-400',
  },
  weak: {
    label: 'Weak',
    icon: ShieldAlert,
    className: 'text-red-400',
  },
};

export function StrengthIndicator({ strength }: StrengthIndicatorProps) {
  const config = strengthConfig[strength];
  const Icon = config.icon;

  return (
    <span className={cn('text-xs font-semibold flex items-center gap-1', config.className)}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

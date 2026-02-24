import { differenceInDays, parseISO } from 'date-fns';
import type { FreshnessLevel } from '@/lib/scoring/types';

export function getFreshnessLevel(dateStr: string): FreshnessLevel {
  const days = differenceInDays(new Date(), parseISO(dateStr));

  if (days < 90) return 'fresh';
  if (days <= 365) return 'aging';
  return 'stale';
}

export function getRecencyMultiplier(dateStr: string): number {
  const level = getFreshnessLevel(dateStr);

  switch (level) {
    case 'fresh':
      return 1.0;
    case 'aging':
      return 0.85;
    case 'stale':
      return 0.7;
  }
}

export function getFreshnessColor(level: FreshnessLevel): string {
  switch (level) {
    case 'fresh':
      return 'text-green-500';
    case 'aging':
      return 'text-yellow-500';
    case 'stale':
      return 'text-red-500';
  }
}

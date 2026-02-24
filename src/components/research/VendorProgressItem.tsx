'use client';

import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorProgressItemProps } from './types';

export function VendorProgressItem({ vendor }: VendorProgressItemProps) {
  const isActive = vendor.state === 'fetching' || vendor.state === 'analyzing';
  const isComplete = vendor.state === 'complete';
  const isPending = vendor.state === 'pending';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
        isActive && 'bg-primary/5',
        isComplete && 'bg-emerald-500/5'
      )}
    >
      {/* Status icon */}
      {isComplete && <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />}
      {isActive && <Loader2 className="size-4 shrink-0 animate-spin text-primary" />}
      {isPending && <Clock className="size-4 shrink-0 text-muted-foreground" />}

      {/* Vendor name */}
      <span
        className={cn(
          'min-w-[100px] text-sm font-medium',
          isPending && 'text-muted-foreground',
          isActive && 'text-foreground',
          isComplete && 'text-foreground'
        )}
      >
        {vendor.vendorName}
      </span>

      {/* Status text */}
      <span className="flex-1 text-xs text-muted-foreground">
        {isPending && 'Pending'}
        {vendor.state === 'fetching' && 'Fetching sources...'}
        {vendor.state === 'analyzing' && 'Analyzing...'}
        {isComplete && (
          <>
            {vendor.sourcesFetched} sources &middot; {vendor.evidenceCount} evidence
          </>
        )}
      </span>
    </div>
  );
}

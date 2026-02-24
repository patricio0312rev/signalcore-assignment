'use client';

import { useMemo } from 'react';
import { VendorProgressItem } from './VendorProgressItem';
import type { VendorProgressProps, VendorStatus } from './types';

export function VendorProgress({ events }: VendorProgressProps) {
  const vendors = useMemo(() => {
    const map = new Map<string, VendorStatus>();

    for (const event of events) {
      if (event.type === 'job_started') {
        map.set(event.vendorId, {
          vendorId: event.vendorId,
          vendorName: event.vendorName,
          state: 'fetching',
          sourcesFetched: 0,
          evidenceCount: 0,
        });
      }

      if (event.type === 'source_fetched') {
        const existing = map.get(event.vendorId);
        if (existing) {
          map.set(event.vendorId, {
            ...existing,
            sourcesFetched: existing.sourcesFetched + (event.status === 'success' ? 1 : 0),
          });
        }
      }

      if (event.type === 'analysis_complete') {
        const existing = map.get(event.vendorId);
        if (existing) {
          map.set(event.vendorId, {
            ...existing,
            state: 'analyzing',
            evidenceCount: existing.evidenceCount + event.evidenceCount,
          });
        }
      }

      if (event.type === 'job_complete') {
        const existing = map.get(event.vendorId);
        if (existing) {
          map.set(event.vendorId, {
            ...existing,
            state: 'complete',
            evidenceCount: event.totalEvidence,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [events]);

  const completedCount = vendors.filter((v) => v.state === 'complete').length;
  const totalCount = vendors.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (vendors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Initializing research pipeline...
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Vendor list */}
      <div className="space-y-1">
        {vendors.map((vendor) => (
          <VendorProgressItem key={vendor.vendorId} vendor={vendor} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount} vendors
        </span>
      </div>
    </div>
  );
}

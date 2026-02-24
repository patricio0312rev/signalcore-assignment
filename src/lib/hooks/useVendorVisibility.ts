'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Vendor } from '@/lib/scoring/types';

interface UseVendorVisibilityReturn {
  visibleIds: Set<string>;
  isVisible: (vendorId: string) => boolean;
  toggle: (vendorId: string) => void;
  resetAll: () => void;
  canToggle: (vendorId: string) => boolean;
}

export function useVendorVisibility(vendors: Vendor[]): UseVendorVisibilityReturn {
  const allIds = useMemo(() => vendors.map((v) => v.id), [vendors]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set(allIds));

  const isVisible = useCallback(
    (vendorId: string) => visibleIds.has(vendorId),
    [visibleIds]
  );

  const canToggle = useCallback(
    (vendorId: string) => {
      if (!visibleIds.has(vendorId)) return true;
      return visibleIds.size > 1;
    },
    [visibleIds]
  );

  const toggle = useCallback(
    (vendorId: string) => {
      setVisibleIds((prev) => {
        const next = new Set(prev);
        if (next.has(vendorId)) {
          if (next.size <= 1) return prev;
          next.delete(vendorId);
        } else {
          next.add(vendorId);
        }
        return next;
      });
    },
    []
  );

  const resetAll = useCallback(() => {
    setVisibleIds(new Set(allIds));
  }, [allIds]);

  return { visibleIds, isVisible, toggle, resetAll, canToggle };
}

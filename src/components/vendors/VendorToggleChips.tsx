'use client';

import { RotateCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vendor } from '@/lib/scoring/types';

interface VendorToggleChipsProps {
  vendors: Vendor[];
  visibleIds: Set<string>;
  onToggle: (vendorId: string) => void;
  onReset: () => void;
  canToggle: (vendorId: string) => boolean;
}

const VENDOR_BG: Record<string, string> = {
  'chart-1': 'bg-[oklch(0.588_0.185_248)]',
  'chart-2': 'bg-[oklch(0.696_0.17_162.48)]',
  'chart-3': 'bg-[oklch(0.645_0.246_16.439)]',
};

const VENDOR_BORDER: Record<string, string> = {
  'chart-1': 'border-[oklch(0.588_0.185_248)]',
  'chart-2': 'border-[oklch(0.696_0.17_162.48)]',
  'chart-3': 'border-[oklch(0.645_0.246_16.439)]',
};

export function VendorToggleChips({
  vendors,
  visibleIds,
  onToggle,
  onReset,
  canToggle,
}: VendorToggleChipsProps) {
  const allVisible = visibleIds.size === vendors.length;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Comparing:</span>
      {vendors.map((vendor) => {
        const visible = visibleIds.has(vendor.id);
        const disabled = !canToggle(vendor.id);

        return (
          <button
            key={vendor.id}
            data-testid="vendor-chip"
            onClick={() => onToggle(vendor.id)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200',
              visible
                ? cn(
                    VENDOR_BORDER[vendor.color] ?? 'border-primary',
                    'bg-white/5 text-foreground'
                  )
                : 'border-border bg-transparent text-muted-foreground opacity-50',
              disabled && visible && 'cursor-not-allowed',
              !disabled && 'hover:brightness-110 cursor-pointer'
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full transition-opacity',
                VENDOR_BG[vendor.color] ?? 'bg-primary',
                !visible && 'opacity-30'
              )}
            />
            {vendor.name}
            {visible ? (
              <Eye className="h-3 w-3 opacity-50" />
            ) : (
              <EyeOff className="h-3 w-3 opacity-50" />
            )}
          </button>
        );
      })}
      {!allVisible && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 rounded-full border border-border bg-background/50 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-2.5 w-2.5" />
          Reset
        </button>
      )}
    </div>
  );
}

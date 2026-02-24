'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Filter, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorScore, Requirement, Score, Priority } from '@/lib/scoring/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PriorityBadge } from '@/components/matrix/PriorityBadge';
import { ScoreCell } from '@/components/matrix/ScoreCell';

interface ComparisonMatrixProps {
  vendorScores: VendorScore[];
  requirements: Requirement[];
  visibleVendorIds: Set<string>;
  onToggleVendor: (vendorId: string) => void;
  onCellClick: (vendorId: string, requirementId: string) => void;
}

const ALL_PRIORITIES: Priority[] = ['high', 'medium', 'low'];

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, onClose, active]);
}

export function ComparisonMatrix({
  vendorScores,
  requirements,
  visibleVendorIds,
  onToggleVendor,
  onCellClick,
}: ComparisonMatrixProps) {
  const [activePriorities, setActivePriorities] = useState<Set<Priority>>(
    new Set(ALL_PRIORITIES)
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  const closeFilter = useCallback(() => setFilterOpen(false), []);
  const closeColumns = useCallback(() => setColumnsOpen(false), []);
  useClickOutside(filterRef, closeFilter, filterOpen);
  useClickOutside(columnsRef, closeColumns, columnsOpen);

  const filteredRequirements = useMemo(
    () => requirements.filter((r) => activePriorities.has(r.priority)),
    [requirements, activePriorities]
  );

  function togglePriority(p: Priority) {
    setActivePriorities((prev) => {
      const next = new Set(prev);
      if (next.has(p)) {
        if (next.size > 1) next.delete(p);
      } else {
        next.add(p);
      }
      return next;
    });
  }

  function findScore(vendorScore: VendorScore, requirementId: string): Score | undefined {
    return vendorScore.scores.find((s) => s.requirementId === requirementId);
  }

  function getHighestVendorId(requirementId: string): string | null {
    let best: { vendorId: string; value: number } | null = null;
    for (const vs of vendorScores) {
      if (!visibleVendorIds.has(vs.vendor.id)) continue;
      const s = findScore(vs, requirementId);
      if (s && (!best || s.score > best.value)) {
        best = { vendorId: vs.vendor.id, value: s.score };
      }
    }
    return best?.vendorId ?? null;
  }

  const isFiltered = activePriorities.size < ALL_PRIORITIES.length;

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Detailed Requirements Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Score comparison across all evaluation criteria
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors cursor-pointer',
                isFiltered
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border bg-background/50 text-muted-foreground hover:text-foreground'
              )}
            >
              <Filter className="h-3 w-3" />
              Filter{isFiltered ? ` (${activePriorities.size})` : ''}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-border bg-card p-2 shadow-lg">
                <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Filter by Priority
                </p>
                {ALL_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                        activePriorities.has(p)
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-background'
                      )}
                    >
                      {activePriorities.has(p) && <Check className="h-3 w-3" />}
                    </div>
                    <span className="capitalize">{p}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customize Columns Dropdown */}
          <div className="relative" ref={columnsRef}>
            <button
              onClick={() => setColumnsOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Customize Columns
            </button>
            {columnsOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-border bg-card p-2 shadow-lg">
                <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Toggle Vendors
                </p>
                {vendorScores.map((vs) => (
                  <button
                    key={vs.vendor.id}
                    onClick={() => onToggleVendor(vs.vendor.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                        visibleVendorIds.has(vs.vendor.id)
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-background'
                      )}
                    >
                      {visibleVendorIds.has(vs.vendor.id) && <Check className="h-3 w-3" />}
                    </div>
                    <span>{vs.vendor.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="min-w-[240px] text-xs text-muted-foreground font-medium">
                Requirement
              </TableHead>
              {vendorScores.map((vs) => {
                const visible = visibleVendorIds.has(vs.vendor.id);
                return (
                  <TableHead
                    key={vs.vendor.id}
                    className={cn(
                      'text-center text-xs text-muted-foreground font-medium transition-all duration-300 overflow-hidden',
                      visible
                        ? 'min-w-[140px] max-w-[200px] opacity-100'
                        : 'min-w-0 max-w-0 p-0 opacity-0'
                    )}
                  >
                    {visible && vs.vendor.name}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequirements.map((req) => {
              const highestVendorId = getHighestVendorId(req.id);

              return (
                <TableRow key={req.id} className="border-border">
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={req.priority} />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {req.name}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-[280px]">
                          {req.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {vendorScores.map((vs) => {
                    const visible = visibleVendorIds.has(vs.vendor.id);
                    const score = findScore(vs, req.id);

                    return (
                      <TableCell
                        key={vs.vendor.id}
                        className={cn(
                          'text-center transition-all duration-300 overflow-hidden',
                          visible
                            ? 'min-w-[140px] max-w-[200px] p-1 opacity-100'
                            : 'min-w-0 max-w-0 p-0 opacity-0'
                        )}
                      >
                        {visible && score ? (
                          <ScoreCell
                            score={score}
                            isHighest={highestVendorId === vs.vendor.id}
                            onClick={() => onCellClick(vs.vendor.id, req.id)}
                          />
                        ) : visible ? (
                          <span className="text-xs text-muted-foreground">--</span>
                        ) : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

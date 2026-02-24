'use client';

import { Filter, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorScore, Requirement, Score } from '@/lib/scoring/types';
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
  onCellClick: (vendorId: string, requirementId: string) => void;
}

export function ComparisonMatrix({
  vendorScores,
  requirements,
  onCellClick,
}: ComparisonMatrixProps) {
  function findScore(vendorScore: VendorScore, requirementId: string): Score | undefined {
    return vendorScore.scores.find((s) => s.requirementId === requirementId);
  }

  function getHighestVendorId(requirementId: string): string | null {
    let best: { vendorId: string; value: number } | null = null;
    for (const vs of vendorScores) {
      const s = findScore(vs, requirementId);
      if (s && (!best || s.score > best.value)) {
        best = { vendorId: vs.vendor.id, value: s.score };
      }
    }
    return best?.vendorId ?? null;
  }

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
          <button className="flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="h-3 w-3" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <SlidersHorizontal className="h-3 w-3" />
            Customize Columns
          </button>
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
              {vendorScores.map((vs) => (
                <TableHead
                  key={vs.vendor.id}
                  className="text-center text-xs text-muted-foreground font-medium min-w-[140px]"
                >
                  {vs.vendor.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements.map((req) => {
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
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                          {req.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {vendorScores.map((vs) => {
                    const score = findScore(vs, req.id);
                    if (!score) {
                      return (
                        <TableCell key={vs.vendor.id} className="text-center">
                          <span className="text-xs text-muted-foreground">--</span>
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={vs.vendor.id} className="text-center p-1">
                        <ScoreCell
                          score={score}
                          isHighest={highestVendorId === vs.vendor.id}
                          onClick={() => onCellClick(vs.vendor.id, req.id)}
                        />
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

'use client';

import { useState, useMemo } from 'react';
import { FolderOpen, Download, Plus } from 'lucide-react';
import type { VendorScore, Requirement, Evidence, Score } from '@/lib/scoring/types';
import { VendorScoreCard } from '@/components/vendors/VendorScoreCard';
import { ComparisonMatrix } from '@/components/matrix/ComparisonMatrix';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  vendorScores: VendorScore[];
  requirements: Requirement[];
  evidence: Evidence[];
}

interface DrawerState {
  open: boolean;
  vendorId: string | null;
  requirementId: string | null;
}

export function Dashboard({ vendorScores, requirements, evidence }: DashboardProps) {
  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    vendorId: null,
    requirementId: null,
  });

  const handleCellClick = (vendorId: string, requirementId: string) => {
    setDrawer({ open: true, vendorId, requirementId });
  };

  const handleDrawerChange = (open: boolean) => {
    setDrawer((prev) => ({ ...prev, open }));
  };

  const drawerData = useMemo(() => {
    if (!drawer.vendorId || !drawer.requirementId) {
      return { vendorName: '', requirementName: '', score: null as Score | null, evidence: [] as Evidence[] };
    }

    const vendor = vendorScores.find((vs) => vs.vendor.id === drawer.vendorId);
    const requirement = requirements.find((r) => r.id === drawer.requirementId);
    const score = vendor?.scores.find((s) => s.requirementId === drawer.requirementId) ?? null;
    const filteredEvidence = evidence.filter(
      (e) => e.vendorId === drawer.vendorId && e.requirementId === drawer.requirementId
    );

    return {
      vendorName: vendor?.vendor.name ?? '',
      requirementName: requirement?.name ?? '',
      score,
      evidence: filteredEvidence,
    };
  }, [drawer.vendorId, drawer.requirementId, vendorScores, requirements, evidence]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
            <FolderOpen className="size-4" />
            <span>Evaluation Projects</span>
            <span className="text-muted-foreground">/</span>
            <span>LLM Ops</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendor Evaluation: LLM Ops Tools
          </h1>
          <p className="mt-1 text-muted-foreground">
            Comparative analysis based on {requirements.length} weighted requirements.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" />
            Export Report
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Vendor Score Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {vendorScores.map((vs, index) => (
          <VendorScoreCard key={vs.vendor.id} vendorScore={vs} rank={index + 1} />
        ))}
      </div>

      {/* Matrix + Radar Chart placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ComparisonMatrix
            vendorScores={vendorScores}
            requirements={requirements}
            onCellClick={handleCellClick}
          />
        </div>
        <div className="flex flex-col gap-6">
          {/* Radar chart placeholder — Feature 5 */}
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-border bg-card p-6 text-muted-foreground">
            <p className="text-sm font-medium">Vendor Radar</p>
            <p className="mt-1 text-xs">Chart coming in Feature 5</p>
          </div>
        </div>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        open={drawer.open}
        onOpenChange={handleDrawerChange}
        vendorName={drawerData.vendorName}
        requirementName={drawerData.requirementName}
        score={drawerData.score}
        evidence={drawerData.evidence}
      />
    </div>
  );
}

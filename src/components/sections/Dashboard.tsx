'use client';

import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FolderOpen, Copy, FileDown } from 'lucide-react';
import { sileo } from 'sileo';
import type { VendorScore, Requirement, Evidence, Score } from '@/lib/scoring/types';
import { recalculateWithWeights } from '@/lib/scoring/recalculate';
import { generateMarkdownReport, copyToClipboard, downloadMarkdown } from '@/lib/utils/export';
import { useVendorVisibility } from '@/lib/hooks/useVendorVisibility';
import { AnimatedSection } from '@/components/layout/AnimatedSection';
import { VendorScoreCard } from '@/components/vendors/VendorScoreCard';
import { VendorToggleChips } from '@/components/vendors/VendorToggleChips';
import { ComparisonMatrix } from '@/components/matrix/ComparisonMatrix';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { VendorRadarChart } from '@/components/charts/VendorRadarChart';
import { PrioritySliders } from '@/components/settings/PrioritySliders';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  vendorScores: VendorScore[];
  requirements: Requirement[];
  evidence: Evidence[];
  customWeights: Record<string, number>;
  onWeightChange: (requirementId: string, value: number) => void;
  onResetWeights: () => void;
}

interface DrawerState {
  open: boolean;
  vendorId: string | null;
  requirementId: string | null;
}

export function Dashboard({
  vendorScores,
  requirements,
  evidence,
  customWeights,
  onWeightChange,
  onResetWeights,
}: DashboardProps) {
  const allVendors = useMemo(() => vendorScores.map((vs) => vs.vendor), [vendorScores]);
  const { visibleIds, toggle, resetAll, canToggle } = useVendorVisibility(allVendors);

  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    vendorId: null,
    requirementId: null,
  });

  const adjustedScores = useMemo(
    () => recalculateWithWeights(vendorScores, customWeights),
    [vendorScores, customWeights]
  );

  const visibleScores = useMemo(
    () => adjustedScores.filter((vs) => visibleIds.has(vs.vendor.id)),
    [adjustedScores, visibleIds]
  );

  const handleToggleVendor = useCallback(
    (vendorId: string) => {
      const wasVisible = visibleIds.has(vendorId);
      toggle(vendorId);
      if (wasVisible) {
        const vendor = allVendors.find((v) => v.id === vendorId);
        if (vendor) {
          sileo.info({ title: `${vendor.name} hidden`, description: 'Click Reset to show all vendors' });
        }
      }
    },
    [toggle, visibleIds, allVendors]
  );

  const handleExportCopy = useCallback(() => {
    const md = generateMarkdownReport({
      vendorScores: visibleScores,
      requirements,
      evidence,
      customWeights,
    });
    copyToClipboard(md).then(() => {
      sileo.success({ title: 'Report copied to clipboard' });
    });
  }, [visibleScores, requirements, evidence, customWeights]);

  const handleExportDownload = useCallback(() => {
    const md = generateMarkdownReport({
      vendorScores: visibleScores,
      requirements,
      evidence,
      customWeights,
    });
    const date = new Date().toISOString().split('T')[0];
    downloadMarkdown(md, `signalcore-report-${date}.md`);
    sileo.success({ title: 'Report downloaded' });
  }, [visibleScores, requirements, evidence, customWeights]);

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

    const vendor = adjustedScores.find((vs) => vs.vendor.id === drawer.vendorId);
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
  }, [drawer.vendorId, drawer.requirementId, adjustedScores, requirements, evidence]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 md:p-8">
      {/* Page Header */}
      <AnimatedSection>
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
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCopy}>
              <Copy className="size-4" />
              Copy Report
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportDownload}>
              <FileDown className="size-4" />
              Download .md
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* Vendor Toggle Chips */}
      <AnimatedSection delay={0.05}>
        <VendorToggleChips
          vendors={allVendors}
          visibleIds={visibleIds}
          onToggle={handleToggleVendor}
          onReset={resetAll}
          canToggle={canToggle}
        />
      </AnimatedSection>

      {/* Vendor Score Cards */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {visibleScores.map((vs, index) => (
              <motion.div
                key={vs.vendor.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <VendorScoreCard vendorScore={vs} rank={index + 1} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </AnimatedSection>

      {/* Matrix + Radar Chart */}
      <AnimatedSection delay={0.2}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ComparisonMatrix
              vendorScores={adjustedScores}
              requirements={requirements}
              visibleVendorIds={visibleIds}
              onToggleVendor={handleToggleVendor}
              onCellClick={handleCellClick}
            />
          </div>
          <div className="flex flex-col gap-6">
            <VendorRadarChart
              vendorScores={visibleScores}
              requirements={requirements}
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Priority Sliders */}
      <AnimatedSection delay={0.3}>
        <PrioritySliders
          requirements={requirements}
          weights={customWeights}
          onWeightChange={onWeightChange}
          onReset={onResetWeights}
        />
      </AnimatedSection>

      {/* Chat Panel */}
      <ChatPanel vendors={allVendors} />

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

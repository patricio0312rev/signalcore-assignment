'use client';

import { Settings, Copy, FileDown } from 'lucide-react';
import type { VendorScore, Requirement, Evidence } from '@/lib/scoring/types';
import { generateMarkdownReport, copyToClipboard, downloadMarkdown } from '@/lib/utils/export';
import { PrioritySliders } from '@/components/settings/PrioritySliders';
import { Button } from '@/components/ui/button';
import { sileo } from 'sileo';
import { useCallback } from 'react';

interface SettingsTabProps {
  vendorScores: VendorScore[];
  requirements: Requirement[];
  evidence: Evidence[];
  customWeights: Record<string, number>;
  onWeightChange: (requirementId: string, value: number) => void;
  onResetWeights: () => void;
}

export function SettingsTab({
  vendorScores,
  requirements,
  evidence,
  customWeights,
  onWeightChange,
  onResetWeights,
}: SettingsTabProps) {
  const handleExportCopy = useCallback(() => {
    const md = generateMarkdownReport({
      vendorScores,
      requirements,
      evidence,
      customWeights,
    });
    copyToClipboard(md).then(() => {
      sileo.success({ title: 'Report copied to clipboard' });
    });
  }, [vendorScores, requirements, evidence, customWeights]);

  const handleExportDownload = useCallback(() => {
    const md = generateMarkdownReport({
      vendorScores,
      requirements,
      evidence,
      customWeights,
    });
    const date = new Date().toISOString().split('T')[0];
    downloadMarkdown(md, `signalcore-report-${date}.md`);
    sileo.success({ title: 'Report downloaded' });
  }, [vendorScores, requirements, evidence, customWeights]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure evaluation weights and export reports.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Priority Sliders */}
        <PrioritySliders
          requirements={requirements}
          weights={customWeights}
          onWeightChange={onWeightChange}
          onReset={onResetWeights}
        />

        {/* Export */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Export Report
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Download or copy the full evaluation report.
            </p>
          </div>
          <div className="p-6 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-center gap-2 cursor-pointer"
              onClick={handleExportCopy}
            >
              <Copy className="size-4" />
              Copy Report to Clipboard
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center gap-2 cursor-pointer"
              onClick={handleExportDownload}
            >
              <FileDown className="size-4" />
              Download as Markdown
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

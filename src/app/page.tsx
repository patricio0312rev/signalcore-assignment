'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, type TabName } from '@/components/layout/Header';
import { Dashboard } from '@/components/sections/Dashboard';
import { VendorsTab } from '@/components/sections/VendorsTab';
import { RequirementsTab } from '@/components/sections/RequirementsTab';
import { SettingsTab } from '@/components/sections/SettingsTab';
import { ResearchPanel } from '@/components/research/ResearchPanel';
import { AnimatedSection } from '@/components/layout/AnimatedSection';
import { calculateVendorScores } from '@/lib/scoring/engine';
import { recalculateWithWeights } from '@/lib/scoring/recalculate';
import { PRIORITY_WEIGHTS } from '@/lib/scoring/weights';
import vendorsData from '@/data/vendors.json';
import requirementsData from '@/data/requirements.json';
import evidenceData from '@/data/evidence.json';
import type { Vendor, Requirement, Evidence } from '@/lib/scoring/types';

const vendors = vendorsData as Vendor[];
const requirements = requirementsData as Requirement[];
const staticEvidence = evidenceData as Evidence[];

function getDefaultWeights(reqs: Requirement[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const req of reqs) {
    weights[req.id] = PRIORITY_WEIGHTS[req.priority];
  }
  return weights;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabName>('Dashboard');
  const [researchedEvidence, setResearchedEvidence] = useState<Evidence[]>(staticEvidence);

  const handleResearchComplete = useCallback((evidence: Evidence[]) => {
    setResearchedEvidence(evidence);
  }, []);

  const vendorScores = useMemo(
    () => calculateVendorScores(vendors, requirements, researchedEvidence),
    [researchedEvidence]
  );

  const defaultWeights = useMemo(() => getDefaultWeights(requirements), []);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>(defaultWeights);

  const adjustedScores = useMemo(
    () => recalculateWithWeights(vendorScores, customWeights),
    [vendorScores, customWeights]
  );

  const handleWeightChange = useCallback((requirementId: string, value: number) => {
    setCustomWeights((prev) => ({ ...prev, [requirementId]: value }));
  }, []);

  const handleResetWeights = useCallback(() => {
    setCustomWeights(defaultWeights);
  }, [defaultWeights]);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {activeTab === 'Dashboard' && (
              <>
                <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
                  <AnimatedSection>
                    <ResearchPanel onResearchComplete={handleResearchComplete} />
                  </AnimatedSection>
                </div>
                <Dashboard
                  vendorScores={vendorScores}
                  requirements={requirements}
                  evidence={researchedEvidence}
                  customWeights={customWeights}
                  onWeightChange={handleWeightChange}
                  onResetWeights={handleResetWeights}
                />
              </>
            )}
            {activeTab === 'Vendors' && (
              <VendorsTab
                vendorScores={adjustedScores}
                requirements={requirements}
              />
            )}
            {activeTab === 'Requirements' && (
              <RequirementsTab
                vendorScores={adjustedScores}
                requirements={requirements}
              />
            )}
            {activeTab === 'Settings' && (
              <SettingsTab
                vendorScores={adjustedScores}
                requirements={requirements}
                evidence={researchedEvidence}
                customWeights={customWeights}
                onWeightChange={handleWeightChange}
                onResetWeights={handleResetWeights}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t border-border text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6 md:px-8">
          <p>SignalCore Intelligence Platform v1.0.0</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Methodology</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

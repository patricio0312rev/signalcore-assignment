import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/sections/Dashboard';
import { calculateVendorScores } from '@/lib/scoring/engine';
import vendorsData from '@/data/vendors.json';
import requirementsData from '@/data/requirements.json';
import evidenceData from '@/data/evidence.json';
import type { Vendor, Requirement, Evidence } from '@/lib/scoring/types';

export default function Home() {
  const vendors = vendorsData as Vendor[];
  const requirements = requirementsData as Requirement[];
  const evidence = evidenceData as Evidence[];

  const vendorScores = calculateVendorScores(vendors, requirements, evidence);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <Dashboard
          vendorScores={vendorScores}
          requirements={requirements}
          evidence={evidence}
        />
      </main>
      <footer className="flex items-center justify-between border-t border-border px-6 py-4 text-xs text-muted-foreground">
        <p>SignalCore Intelligence Platform v1.0.0</p>
        <div className="flex gap-4">
          <span className="hover:text-foreground cursor-pointer transition-colors">Documentation</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Methodology</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Support</span>
        </div>
      </footer>
    </div>
  );
}

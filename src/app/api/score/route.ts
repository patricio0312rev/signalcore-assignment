import { NextResponse } from 'next/server';
import { calculateVendorScores } from '@/lib/scoring/engine';
import vendorsData from '@/data/vendors.json';
import requirementsData from '@/data/requirements.json';
import evidenceData from '@/data/evidence.json';
import type { Vendor, Requirement, Evidence } from '@/lib/scoring/types';

export async function GET() {
  const vendorScores = calculateVendorScores(
    vendorsData as Vendor[],
    requirementsData as Requirement[],
    evidenceData as Evidence[]
  );

  return NextResponse.json(vendorScores);
}

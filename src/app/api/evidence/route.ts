import { NextRequest, NextResponse } from 'next/server';
import evidenceData from '@/data/evidence.json';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get('vendorId');
  const requirementId = searchParams.get('requirementId');

  let filtered = evidenceData;

  if (vendorId) {
    filtered = filtered.filter((e) => e.vendorId === vendorId);
  }
  if (requirementId) {
    filtered = filtered.filter((e) => e.requirementId === requirementId);
  }

  return NextResponse.json(filtered);
}

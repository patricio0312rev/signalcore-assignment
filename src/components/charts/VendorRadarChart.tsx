'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { VendorScore, Requirement } from '@/lib/scoring/types';

interface VendorRadarChartProps {
  vendorScores: VendorScore[];
  requirements: Requirement[];
}

const VENDOR_COLORS: Record<string, string> = {
  'chart-1': 'oklch(0.588 0.185 248)',
  'chart-2': 'oklch(0.696 0.17 162.48)',
  'chart-3': 'oklch(0.645 0.246 16.439)',
};

function getVendorColor(colorKey: string): string {
  return VENDOR_COLORS[colorKey] ?? 'oklch(0.588 0.185 248)';
}

export function VendorRadarChart({ vendorScores, requirements }: VendorRadarChartProps) {
  const data = requirements.map((req) => {
    const entry: Record<string, string | number> = {
      requirement: req.name.length > 14 ? req.name.slice(0, 12) + '…' : req.name,
      fullName: req.name,
    };

    for (const vs of vendorScores) {
      const score = vs.scores.find((s) => s.requirementId === req.id);
      entry[vs.vendor.id] = score?.score ?? 0;
    }

    return entry;
  });

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold text-foreground">
          Vendor Radar
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Score distribution across requirements
        </p>
      </div>

      <div className="p-4">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid
              stroke="oklch(0.333 0.02 254)"
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="requirement"
              tick={{ fill: 'oklch(0.637 0.025 256)', fontSize: 11 }}
            />
            <PolarRadiusAxis
              domain={[0, 10]}
              tick={{ fill: 'oklch(0.637 0.025 256)', fontSize: 10 }}
              axisLine={false}
              tickCount={6}
            />
            {vendorScores.map((vs) => (
              <Radar
                key={vs.vendor.id}
                name={vs.vendor.name}
                dataKey={vs.vendor.id}
                stroke={getVendorColor(vs.vendor.color)}
                fill={getVendorColor(vs.vendor.color)}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(0.21 0.017 254)',
                border: '1px solid oklch(0.333 0.02 254)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'oklch(0.97 0.006 264)',
              }}
              formatter={(value) => typeof value === 'number' ? value.toFixed(1) : String(value ?? '')}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: 'oklch(0.637 0.025 256)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

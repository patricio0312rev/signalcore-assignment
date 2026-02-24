'use client';

import { RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { Requirement } from '@/lib/scoring/types';
import { cn } from '@/lib/utils';

interface PrioritySlidersProps {
  requirements: Requirement[];
  weights: Record<string, number>;
  onWeightChange: (requirementId: string, value: number) => void;
  onReset: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
};

export function PrioritySliders({
  requirements,
  weights,
  onWeightChange,
  onReset,
}: PrioritySlidersProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Priority Weights
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adjust importance of each requirement
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="space-y-5 p-6">
        {requirements.map((req) => {
          const weight = weights[req.id] ?? 1;

          return (
            <div key={req.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-medium uppercase', PRIORITY_COLORS[req.priority])}>
                    {req.priority}
                  </span>
                  <span className="text-sm text-foreground">{req.name}</span>
                </div>
                <span className="font-mono text-sm font-bold text-foreground">
                  {weight}
                </span>
              </div>
              <Slider
                value={[weight]}
                onValueChange={([val]) => onWeightChange(req.id, val)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

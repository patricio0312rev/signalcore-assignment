'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResearchSession } from '@/lib/hooks/useResearchSession';
import { VendorProgress } from './VendorProgress';
import { EventLog } from './EventLog';
import { ResearchSummary } from './ResearchSummary';
import type { ResearchPanelProps } from './types';

export function ResearchPanel({ onResearchComplete }: ResearchPanelProps) {
  const { state, startResearch, isRunning } = useResearchSession();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse 3 seconds after completion
  useEffect(() => {
    if (state.status !== 'complete') return;

    const timer = setTimeout(() => {
      setCollapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [state.status]);

  // Notify parent when evidence is available
  useEffect(() => {
    if (state.status === 'complete' && state.evidence) {
      onResearchComplete(state.evidence);
    }
  }, [state.status, state.evidence, onResearchComplete]);

  const handleStart = useCallback(() => {
    setCollapsed(false);
    startResearch();
  }, [startResearch]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div data-walkthrough="research-panel" className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-3">
          <StatusIcon status={state.status} />
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {state.status === 'complete' ? 'Research Complete' : 'Research Pipeline'}
            </h2>
            {state.status === 'complete' && !collapsed && (
              <ResearchSummary
                events={state.events}
                startedAt={state.startedAt}
                completedAt={state.completedAt}
              />
            )}
            {state.status === 'running' && (
              <p className="text-xs text-muted-foreground">
                Researching vendors...
              </p>
            )}
            {state.status === 'error' && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(state.status === 'idle' || state.status === 'complete' || state.status === 'error') && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleStart();
              }}
              disabled={isRunning}
              className="gap-2"
            >
              <Search className="size-3.5" />
              {state.status === 'idle' ? 'Run Research' : 'Run Again'}
            </Button>
          )}
          {collapsed ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="border-t border-border px-4 py-4">
          {state.status === 'idle' && (
            <p className="text-sm text-muted-foreground">
              Run the research pipeline to automatically fetch and analyze vendor
              documentation, GitHub repos, blog posts, and community discussions.
              Evidence scores will update in real-time.
            </p>
          )}

          {state.status === 'running' && (
            <div className="space-y-4">
              <VendorProgress events={state.events} />
              <EventLog events={state.events} />
            </div>
          )}

          {state.status === 'complete' && (
            <ResearchSummary
              events={state.events}
              startedAt={state.startedAt}
              completedAt={state.completedAt}
            />
          )}

          {state.status === 'error' && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Research failed
                </p>
                <p className="text-xs text-destructive/80">
                  {state.error ?? 'An unknown error occurred'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="size-5 text-emerald-500" />;
    case 'running':
      return <Loader2 className="size-5 animate-spin text-primary" />;
    case 'error':
      return <AlertCircle className="size-5 text-destructive" />;
    default:
      return <Search className="size-5 text-muted-foreground" />;
  }
}

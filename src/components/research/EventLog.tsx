'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { EventLogProps } from './types';
import type { ResearchEvent } from '@/lib/research/types';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function eventToMessage(event: ResearchEvent): string {
  switch (event.type) {
    case 'job_started':
      return `Started research for ${event.vendorName}`;
    case 'source_fetched':
      return event.status === 'success'
        ? `Fetched: ${event.title}`
        : `Failed to fetch: ${event.url}`;
    case 'analysis_complete':
      return `Analyzed ${event.requirementId} - found ${event.evidenceCount} evidence`;
    case 'job_complete':
      return `Completed ${event.vendorId} with ${event.totalEvidence} total evidence`;
    case 'session_complete':
      return `Research complete: ${event.totalEvidence} evidence in ${(event.duration / 1000).toFixed(1)}s`;
    case 'error':
      return `Error: ${event.message}`;
  }
}

function isErrorEvent(event: ResearchEvent): boolean {
  if (event.type === 'error') return true;
  if (event.type === 'source_fetched' && event.status === 'error') return true;
  return false;
}

export function EventLog({ events }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  if (events.length === 0) {
    return null;
  }

  const now = new Date();

  return (
    <div
      ref={scrollRef}
      className="max-h-48 overflow-y-auto rounded-md border border-border bg-background/50 p-3 custom-scrollbar"
    >
      <div className="space-y-1">
        {events.map((event, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-2 font-mono text-xs',
              isErrorEvent(event) ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            <span className="shrink-0 text-muted-foreground/60">
              [{formatTime(now)}]
            </span>
            <span>{eventToMessage(event)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

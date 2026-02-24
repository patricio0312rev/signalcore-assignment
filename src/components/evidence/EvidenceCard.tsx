import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Evidence } from '@/lib/scoring/types';
import { SourceTypeBadge } from '@/components/evidence/SourceTypeBadge';
import { FreshnessBadge } from '@/components/evidence/FreshnessBadge';
import { StrengthIndicator } from '@/components/evidence/StrengthIndicator';

interface EvidenceCardProps {
  evidence: Evidence;
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const publishedDate = format(new Date(evidence.publishedAt), 'MMM d, yyyy');
  const truncatedUrl = evidence.sourceUrl.replace(/^https?:\/\//, '').slice(0, 50);

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 transition',
        'hover:border-primary/50'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SourceTypeBadge sourceType={evidence.sourceType} />
          <FreshnessBadge dateStr={evidence.publishedAt} />
        </div>
        <StrengthIndicator strength={evidence.strength} />
      </div>

      <h4 className="mt-3 text-lg font-bold text-foreground transition hover:text-primary">
        {evidence.claim}
      </h4>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {evidence.snippet}
      </p>

      <div className="mt-4 border-t border-border pt-3 flex items-center justify-between">
        <a
          href={evidence.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-primary"
        >
          <ExternalLink className="size-3" />
          <span className="truncate max-w-[200px]">{truncatedUrl}</span>
        </a>
        <span className="text-xs text-muted-foreground">{publishedDate}</span>
      </div>
    </div>
  );
}

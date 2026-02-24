import { FileText, Github, Newspaper, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SourceType } from '@/lib/scoring/types';

interface SourceTypeBadgeProps {
  sourceType: SourceType;
}

const sourceTypeConfig: Record<
  SourceType,
  { label: string; icon: typeof FileText; className: string }
> = {
  official: {
    label: 'Official Docs',
    icon: FileText,
    className: 'bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20',
  },
  github: {
    label: 'GitHub',
    icon: Github,
    className: 'bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/20',
  },
  blog: {
    label: 'Blog',
    icon: Newspaper,
    className: 'bg-orange-500/10 text-orange-400 ring-1 ring-inset ring-orange-500/20',
  },
  community: {
    label: 'Community',
    icon: Users,
    className: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
  },
};

export function SourceTypeBadge({ sourceType }: SourceTypeBadgeProps) {
  const config = sourceTypeConfig[sourceType];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium gap-1',
        config.className
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}

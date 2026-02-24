import { Skeleton } from '@/components/ui/skeleton';

export function VendorScoreCardSkeleton() {
  return (
    <div className="relative rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1.5 h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-8 w-14" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

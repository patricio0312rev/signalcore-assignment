import { Skeleton } from '@/components/ui/skeleton';

export function MatrixSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-1.5 h-3 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-32 rounded-md" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[240px]">
              <Skeleton className="h-5 w-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-48" />
              </div>
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex flex-col items-center gap-1.5 min-w-[140px]">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-1.5 w-16 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

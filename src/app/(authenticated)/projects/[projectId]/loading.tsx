import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectLoading() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <div className="flex -space-x-2 space-x-reverse">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-7 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="min-w-[280px] w-[280px] space-y-3">
            <Skeleton className="h-6 w-20" />
            <div className="space-y-2">
              {Array.from({ length: 3 - col }).map((_, card) => (
                <div key={card} className="rounded-lg border p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

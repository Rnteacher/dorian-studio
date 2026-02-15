import { Skeleton } from '@/components/ui/skeleton'

export default function TimelineLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-7 w-[140px]" />
          <Skeleton className="h-9 w-9" />
        </div>
        <Skeleton className="h-9 w-16" />
      </div>
      <div className="border rounded-lg">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full border-t" />
        ))}
      </div>
    </div>
  )
}

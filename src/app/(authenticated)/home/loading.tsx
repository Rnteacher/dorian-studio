import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function HomeLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-36 mt-2" />
      </div>

      {/* Quote */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3">
            <Skeleton className="h-6 w-6 shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div>
                  <Skeleton className="h-7 w-8" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <Separator />
          <CardContent className="pt-3 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <Separator />
          <CardContent className="pt-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

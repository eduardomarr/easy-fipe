import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function FipeResultSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-lg shadow-primary/10">
      <div className="bg-red-50 px-6 py-5">
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-6 w-2/3 mb-4" />
        <Skeleton className="h-10 w-40" />
      </div>
      <CardContent className="pt-5 pb-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

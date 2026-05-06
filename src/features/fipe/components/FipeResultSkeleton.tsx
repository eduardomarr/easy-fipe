import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export function FipeResultSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 shadow-lg shadow-primary/5">
      <div className="px-6 pt-6 pb-5">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-5 w-2/3 mb-5" />
        <Skeleton className="h-10 w-44" />
      </div>
      <Separator className="opacity-50" />
      <CardContent className="pt-5 pb-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

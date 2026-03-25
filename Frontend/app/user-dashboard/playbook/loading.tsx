import { UserLayout } from "@/components/dashboard/user-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen } from "lucide-react"

export default function Loading() {
  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security Playbooks</h1>
            <p className="text-muted-foreground">Step-by-step incident response and mitigation guides</p>
          </div>
        </div>

        <Skeleton className="h-24 w-full" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </UserLayout>
  )
}
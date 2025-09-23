import { AppLayout } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoadingBriefPage() {
  return (
    <AppLayout>
       <div className="space-y-6">
        <div className="flex items-start justify-between">
            <div>
                <Skeleton className="h-9 w-96 mb-2" />
                <Skeleton className="h-5 w-48" />
            </div>
             <Skeleton className="h-14 w-20" />
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                 <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                 <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                 <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                 <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

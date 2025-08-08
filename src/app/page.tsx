import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FilePlus2 } from 'lucide-react';
import { getDecisions } from '@/lib/data';
import { DashboardTable } from '@/components/dashboard-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const decisions = await getDecisions();

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Secretariat Dashboard</h1>
          <p className="text-muted-foreground">Review and manage all submitted decisions.</p>
        </div>
        <Button asChild>
          <Link href="/submit">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Submit Decision
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardTable decisions={decisions} />
        </CardContent>
      </Card>
    </div>
  );
}

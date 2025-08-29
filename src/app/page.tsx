

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FilePlus2, FileSearch, CheckSquare, Hourglass } from 'lucide-react';
import { getDecisions, getObjectives } from '@/lib/data';
import { DashboardTable } from '@/components/dashboard-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import type { Objective, DecisionStatus } from '@/lib/types';

export default async function DashboardPage() {
  const decisions = await getDecisions();
  const objectives = await getObjectives();

  const submittedCount = decisions.filter(d => d.status === 'Submitted').length;
  const inReviewCount = decisions.filter(d => d.status === 'In Review').length;
  const scheduledCount = decisions.filter(d => d.status === 'Scheduled for Meeting').length;
  const awaitingUpdateCount = decisions.filter(d => d.status === 'Awaiting Update').length;
  
  const activeStatuses: DecisionStatus[] = ['Submitted', 'In Review', 'Awaiting Update', 'Scheduled for Meeting'];
  const activeDecisions = decisions.filter(d => activeStatuses.includes(d.status));

  return (
    <>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 gap-6">
          <div className="flex items-center gap-4">
             <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Secretariat Dashboard</h1>
              <p className="text-muted-foreground">Review and manage all submitted decisions.</p>
            </div>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Submitted
                </CardTitle>
                <FilePlus2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submittedCount}</div>
                <p className="text-xs text-muted-foreground">
                  New proposals awaiting review
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Review
                </CardTitle>
                <FileSearch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inReviewCount}</div>
                <p className="text-xs text-muted-foreground">
                  Proposals currently being vetted
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Awaiting Update</CardTitle>
                <Hourglass className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{awaitingUpdateCount}</div>
                <p className="text-xs text-muted-foreground">
                  Proposals awaiting submitter changes
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled for Meeting</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledCount}</div>
                 <p className="text-xs text-muted-foreground">
                  Decisions ready for a meeting
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submitted Decisions</CardTitle>
              <CardDescription>A list of all proposals in the decision pipeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardTable decisions={activeDecisions} />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}

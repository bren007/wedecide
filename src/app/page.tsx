

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FilePlus2, FileSearch, TrendingUp, CheckSquare, Hourglass } from 'lucide-react';
import { getDecisions, getObjectives } from '@/lib/data';
import { DashboardTable } from '@/components/dashboard-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import type { Objective } from '@/lib/types';

async function getMostFrequentObjective(decisions: Awaited<ReturnType<typeof getDecisions>>, objectives: Objective[]): Promise<Objective | null> {
  if (decisions.length === 0) {
    return null;
  }

  const objectiveCounts = decisions.reduce((acc, decision) => {
    acc[decision.objectiveId] = (acc[decision.objectiveId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostFrequentId = Object.keys(objectiveCounts).reduce((a, b) =>
    objectiveCounts[a] > objectiveCounts[b] ? a : b
  );
  
  return objectives.find(o => o.id === mostFrequentId) || null;
}

export default async function DashboardPage() {
  const decisions = await getDecisions();
  const objectives = await getObjectives();

  const submittedCount = decisions.filter(d => d.status === 'Submitted').length;
  const inReviewCount = decisions.filter(d => d.status === 'In Review').length;
  const scheduledCount = decisions.filter(d => d.status === 'Scheduled for Meeting').length;
  const mostFrequentObjective = await getMostFrequentObjective(decisions, objectives);

  return (
    <>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Secretariat Dashboard</h1>
              <p className="text-muted-foreground">Review and manage all submitted decisions.</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Strategic Hotspot</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-base font-bold truncate">{mostFrequentObjective?.name || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  Most frequently targeted objective
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
              <DashboardTable decisions={decisions} />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}



import { getDecisions, getObjectives } from '@/lib/data';
import { AgendaItem } from '@/components/agenda-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Clock, TrendingUp, Target, BarChart } from 'lucide-react';
import type { Decision, Objective } from '@/lib/types';
import { PastDecisionsFilterBar } from '@/components/past-decisions-filter-bar';
import { differenceInBusinessDays } from 'date-fns';


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

function getAverageAlignmentScore(decisions: Awaited<ReturnType<typeof getDecisions>>): number {
    if (decisions.length === 0) return 0;
    const decisionsWithScores = decisions.filter(d => typeof d.alignmentScore === 'number');
    if (decisionsWithScores.length === 0) return 0;

    const totalScore = decisionsWithScores.reduce((acc, d) => acc + (d.alignmentScore || 0), 0);
    return Math.round(totalScore / decisionsWithScores.length);
}

function getAverageDecisionCycleTime(decisions: Decision[]): number {
  const decisionsWithDates = decisions.filter(d => d.submittedAt && d.decidedAt);
  if (decisionsWithDates.length === 0) {
    return 0;
  }

  const totalDays = decisionsWithDates.reduce((acc, decision) => {
    const submitted = new Date(decision.submittedAt);
    const decided = new Date(decision.decidedAt!);
    return acc + differenceInBusinessDays(decided, submitted);
  }, 0);

  return Math.round(totalDays / decisionsWithDates.length);
}

function getDecisionRate(decisions: Decision[]): number {
    if (decisions.length === 0) {
        return 0;
    }
    const actionStatuses: (typeof decisions[0]['status'])[] = ['Approved', 'Endorsed', 'Not Approved', 'Not Endorsed'];
    const actionDecisions = decisions.filter(d => actionStatuses.includes(d.status));

    return Math.round((actionDecisions.length / decisions.length) * 100);
}


export default async function PastDecisionsPage() {
  const allDecisions = await getDecisions();
  const objectives = await getObjectives();
  const pastDecisions = allDecisions.filter(d =>
    ['Approved', 'Endorsed', 'Noted', 'Not Approved', 'Not Endorsed'].includes(d.status)
  );
  
  const mostFrequentObjective = await getMostFrequentObjective(pastDecisions, objectives);
  const averageAlignmentScore = getAverageAlignmentScore(pastDecisions);
  const averageCycleTime = getAverageDecisionCycleTime(pastDecisions);
  const decisionRate = getDecisionRate(pastDecisions);

  return (
    <>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
          <header className="flex items-center gap-4">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Decision Bank</h1>
              <p className="text-muted-foreground">Treating decisions as a strategic asset. Each decision deposited improves future analysis, compliance, and organizational intelligence.</p>
            </div>
          </header>
          
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Decision Cycle Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageCycleTime} days</div>
                <p className="text-xs text-muted-foreground">
                  Average business days to decision
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Strategic Focus</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-base font-bold truncate">{mostFrequentObjective?.name || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  Most frequently targeted objective
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Alignment Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageAlignmentScore}</div>
                 <p className="text-xs text-muted-foreground">
                  Average alignment with strategic goals
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Decision Rate</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{decisionRate}%</div>
                 <p className="text-xs text-muted-foreground">
                  Ratio of actions vs. notes
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Decision Archive</CardTitle>
              <CardDescription>Filter and search through all past decisions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <PastDecisionsFilterBar objectives={objectives} />
               <div className="space-y-4">
                {pastDecisions.length > 0 ? (
                pastDecisions.map(decision => (
                    <AgendaItem key={decision.id} decision={decision} objective={objectives.find(o => o.id === decision.objectiveId)} />
                ))
                ) : (
                <Card className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No past decisions recorded.</p>
                </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}

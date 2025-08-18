

import { getDecisions, getObjectives } from '@/lib/data';
import { AgendaItem } from '@/components/agenda-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { FileCheck, ThumbsUp, Bookmark, FileX, TrendingUp, Target, ListChecks, Filter, Calendar as CalendarIcon } from 'lucide-react';
import type { Objective } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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


export default async function PastDecisionsPage() {
  const allDecisions = await getDecisions();
  const objectives = await getObjectives();
  const pastDecisions = allDecisions.filter(d =>
    ['Approved', 'Endorsed', 'Noted', 'Not Approved'].includes(d.status)
  );
  
  const mostFrequentObjective = await getMostFrequentObjective(pastDecisions, objectives);
  const averageAlignmentScore = getAverageAlignmentScore(pastDecisions);
  const decisionTypes = ['Approve', 'Endorse', 'Note', 'Not Approved'];

  return (
    <>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Past Decisions</h1>
            <p className="text-muted-foreground">A record of all previously considered decisions and their strategic impact.</p>
          </div>
          
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Decisions Recorded
                </CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pastDecisions.length}</div>
                <p className="text-xs text-muted-foreground">
                  A complete archive of all past decisions
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
          </div>
          
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Decision Archive</CardTitle>
                <CardDescription>Filter and search through all past decisions.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                 <Select>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by objective..." />
                    </SelectTrigger>
                    <SelectContent>
                      {objectives.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {decisionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                   <Button variant="outline" className="w-full md:w-auto" disabled>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Filter by date
                    </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {pastDecisions.length > 0 ? (
                pastDecisions.map(decision => (
                    <AgendaItem key={decision.id} decision={decision} objective={objectives.find(o => o.id === decision.objectiveId)} />
                ))
                ) : (
                <Card className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No past decisions recorded.</p>
                </Card>
                )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}

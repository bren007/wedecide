
import { getDecisions, getObjectives } from '@/lib/data';
import { AgendaItem } from '@/components/agenda-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { DecisionsByObjectiveChart } from '@/components/decisions-by-objective-chart';
import { FileCheck, ThumbsUp, Bookmark, FileX, TrendingUp, Target, ListChecks } from 'lucide-react';
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
             <div className="lg:col-span-1 space-y-6">
                <DecisionsByObjectiveChart decisions={pastDecisions} objectives={objectives} />
            </div>
            <div className="lg:col-span-2 space-y-6">
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
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

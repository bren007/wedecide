
import { getDecisions, getObjectives } from '@/lib/data';
import { AgendaItem } from '@/components/agenda-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { DecisionsByObjectiveChart } from '@/components/decisions-by-objective-chart';
import { FileCheck, ThumbsUp, Bookmark, FileX } from 'lucide-react';

export default async function PastDecisionsPage() {
  const allDecisions = await getDecisions();
  const objectives = await getObjectives();
  const pastDecisions = allDecisions.filter(d =>
    ['Approved', 'Endorsed', 'Noted', 'Not Approved'].includes(d.status)
  );

  const stats = pastDecisions.reduce((acc, decision) => {
    acc[decision.status] = (acc[decision.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Past Decisions</h1>
            <p className="text-muted-foreground">A record of all previously considered decisions.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
             <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Decision Outcomes</CardTitle>
                        <CardDescription>A summary of all recorded decisions.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                            <FileCheck className="h-6 w-6 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats['Approved'] || 0}</p>
                                <p className="text-sm text-muted-foreground">Approved</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                            <ThumbsUp className="h-6 w-6 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats['Endorsed'] || 0}</p>
                                <p className="text-sm text-muted-foreground">Endorsed</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                            <Bookmark className="h-6 w-6 text-slate-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats['Noted'] || 0}</p>
                                <p className="text-sm text-muted-foreground">Noted</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                            <FileX className="h-6 w-6 text-red-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats['Not Approved'] || 0}</p>
                                <p className="text-sm text-muted-foreground">Not Approved</p>
                            </div>
                        </div>
                    </CardContent>
                 </Card>
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

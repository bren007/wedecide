import { getDecisions, getObjectives, getObjectiveById } from '@/lib/data';
import { AgendaItem } from '@/components/agenda-item';
import { IntelligentExploration } from '@/components/intelligent-exploration';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ProposalSummary } from '@/components/proposal-summary';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default async function MeetingPage() {
  const allDecisions = await getDecisions();
  const objectives = await getObjectives();
  const scheduledDecisions = allDecisions.filter(d => d.status === 'Scheduled for Meeting');
  const pastDecisions = allDecisions.filter(d =>
    ['Approved', 'Endorsed', 'Noted', 'Not Approved'].includes(d.status)
  );

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meeting Agenda</h1>
        <p className="text-muted-foreground">Review and finalize decisions for the current meeting.</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           <h2 className="text-xl font-semibold tracking-tight lg:col-span-2">Scheduled for Decision</h2>
           <h2 className="text-xl font-semibold tracking-tight">Decision Support</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-6">
            {scheduledDecisions.length > 0 ? (
              scheduledDecisions.map(decision => (
                <AgendaItem key={decision.id} decision={decision} objective={objectives.find(o => o.id === decision.objectiveId)} />
              ))
            ) : (
              <Card className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No decisions currently scheduled for meeting.</p>
              </Card>
            )}
          </div>
          <div className="lg:col-span-1 space-y-6 sticky top-8">
             <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <ProposalSummaries decisions={scheduledDecisions} />
             </Suspense>
            <IntelligentExploration decisions={scheduledDecisions} />
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-6">Past Decisions</h2>
          <div className="space-y-6">
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
    </div>
  );
}

async function ProposalSummaries({ decisions }: { decisions: (Awaited<ReturnType<typeof getDecisions>>)}) {
    const objectives = await Promise.all(decisions.map(d => getObjectiveById(d.objectiveId)));
    return (
        <>
        {decisions.map((decision, i) => (
            <div key={decision.id} className="hidden">
                 <ProposalSummary background={decision.background} objective={objectives[i]} />
            </div>
        ))}
        {decisions.length > 0 && <ProposalSummary background={decisions[0].background} objective={objectives[0]} />}
        </>
    )
}
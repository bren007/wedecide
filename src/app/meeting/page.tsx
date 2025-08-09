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

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meeting Agenda</h1>
        <p className="text-muted-foreground">Review and finalize decisions for the current meeting.</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold tracking-tight">Scheduled for Decision</h2>
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
            <h2 className="text-xl font-semibold tracking-tight">Decision Support</h2>
            <ProposalSummary decisions={scheduledDecisions} />
            <IntelligentExploration decisions={scheduledDecisions} />
          </div>
        </div>
      </div>
    </div>
  );
}

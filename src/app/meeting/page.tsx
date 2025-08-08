import { getDecisions, getObjectives } from '@/lib/data';
import { AgendaItem } from '@/components/agenda-item';
import { IntelligentSupport } from '@/components/intelligent-support';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

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

      <div className="grid gap-8 lg:grid-cols-3">
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

            <Separator className="my-8" />

            <h2 className="text-xl font-semibold tracking-tight">Past Decisions</h2>
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
        <div className="lg:col-span-1">
            <IntelligentSupport decisions={scheduledDecisions} />
        </div>
      </div>
    </div>
  );
}

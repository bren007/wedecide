import { getDecisions, getObjectives } from '@/lib/data';
import { AgendaItem } from '@/components/agenda-item';
import { Card } from '@/components/ui/card';

export default async function PastDecisionsPage() {
  const allDecisions = await getDecisions();
  const objectives = await getObjectives();
  const pastDecisions = allDecisions.filter(d =>
    ['Approved', 'Endorsed', 'Noted', 'Not Approved'].includes(d.status)
  );

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Past Decisions</h1>
        <p className="text-muted-foreground">A record of all previously considered decisions.</p>
      </div>
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
  );
}

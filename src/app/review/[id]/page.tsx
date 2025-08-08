import { getDecisionById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { approveForMeeting } from './actions';
import { ProposalSummary } from '@/components/proposal-summary';
import { FitnessQuestions } from '@/components/fitness-questions';
import { CheckCircle2 } from 'lucide-react';

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const decision = await getDecisionById(params.id);

  if (!decision) {
    notFound();
  }

  const canApprove = decision.status === 'Submitted' || decision.status === 'In Review';

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-2">{decision.decisionType}</Badge>
                  <CardTitle className="text-2xl">{decision.title}</CardTitle>
                </div>
                <form action={approveForMeeting.bind(null, decision.id)}>
                    <Button type="submit" disabled={!canApprove}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve for Meeting
                    </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2 text-lg">Background</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{decision.background}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <ProposalSummary background={decision.background} />
            <FitnessQuestions decision={decision} />
        </div>
      </div>
    </div>
  );
}

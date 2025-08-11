'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Decision, DecisionStatus, Objective } from '@/lib/types';
import { setDecisionOutcome } from '@/app/meeting/actions';
import { ThumbsUp, ThumbsDown, Check, Bookmark, FileCheck, FileX, Loader2, Target, FileText } from 'lucide-react';
import { useTransition } from 'react';

type OutcomeButtonProps = {
  decisionId: string;
  outcome: DecisionStatus;
  currentStatus: DecisionStatus;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
}

function OutcomeButton({ decisionId, outcome, currentStatus, children, variant = 'outline' }: OutcomeButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSetOutcome = async () => {
    startTransition(() => {
      setDecisionOutcome(decisionId, outcome);
    });
  };
  
  const isPastDecision = ['Approved', 'Endorsed', 'Noted', 'Not Approved'].includes(currentStatus);

  if (isPastDecision) return null;

  return (
    <Button variant={variant} size="sm" onClick={handleSetOutcome} disabled={isPending}>
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}

const statusConfig = {
  Approved: { icon: FileCheck, color: 'text-green-600', text: 'Approved' },
  Endorsed: { icon: ThumbsUp, color: 'text-blue-600', text: 'Endorsed' },
  Noted: { icon: Bookmark, color: 'text-slate-600', text: 'Noted' },
  'Not Approved': { icon: FileX, color: 'text-red-600', text: 'Not Approved' },
  'Scheduled for Meeting': { icon: () => null, color: '', text: '' }
};


export function AgendaItem({ decision, objective }: { decision: Decision; objective?: Objective }) {
  const { title, background, decisionType, status, id } = decision;
  const isPastDecision = status !== 'Scheduled for Meeting';
  const config = statusConfig[status] || {};
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <Badge variant="outline" className="mb-2">{decisionType}</Badge>
                <CardTitle>{title}</CardTitle>
            </div>
            {isPastDecision && (
                <div className={`flex items-center gap-2 font-semibold ${config.color}`}>
                    <Icon className="h-5 w-5" />
                    <span>{config.text}</span>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {objective && (
          <div className="flex items-start gap-3 text-muted-foreground p-3 bg-muted/50 rounded-lg text-sm">
            <Target className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">{objective.name}</p>
              <p>{objective.description}</p>
            </div>
          </div>
        )}
        <p className="text-muted-foreground text-sm line-clamp-3">{background}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between items-center gap-2">
        <div>
            <Button variant="outline" size="sm" disabled>
                <FileText className="mr-2 h-4 w-4"/>
                View Proposal
            </Button>
        </div>
        {!isPastDecision && (
            <div className="flex justify-end gap-2 flex-wrap">
                <OutcomeButton decisionId={id} currentStatus={status} outcome="Approved" variant="default"><Check className="mr-2 h-4 w-4" />Approve</OutcomeButton>
                <OutcomeButton decisionId={id} currentStatus={status} outcome="Endorsed"><ThumbsUp className="mr-2 h-4 w-4" />Endorse</OutcomeButton>
                <OutcomeButton decisionId={id} currentStatus={status} outcome="Noted"><Bookmark className="mr-2 h-4 w-4" />Note</OutcomeButton>
                <OutcomeButton decisionId={id} currentStatus={status} outcome="Not Approved" variant="destructive"><ThumbsDown className="mr-2 h-4 w-4" />Not Approve</OutcomeButton>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}

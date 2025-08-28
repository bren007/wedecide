
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Decision, DecisionStatus, Objective } from '@/lib/types';
import { setDecisionOutcome } from '@/app/meeting/actions';
import { ThumbsUp, ThumbsDown, Check, Bookmark, FileCheck, FileX, Loader2, Target, FileText, Download, Handshake, MinusCircle, CheckCircle, XCircle, ClipboardList, Users } from 'lucide-react';
import { useTransition } from 'react';
import { StrategicAlignment } from './strategic-alignment';
import { ConsultationSummary } from './consultation-summary';

type OutcomeButtonProps = {
  decision: Decision;
  outcome: DecisionStatus;
  currentStatus: DecisionStatus;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
  onDecisionUpdate: (decision: Decision) => void;
}

function OutcomeButton({ decision, outcome, currentStatus, children, variant = 'outline', onDecisionUpdate }: OutcomeButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSetOutcome = async () => {
    startTransition(async () => {
      const updatedDecision = await setDecisionOutcome(decision.id, outcome);
      if (updatedDecision) {
        onDecisionUpdate(updatedDecision);
      }
    });
  };
  
  const isPastDecision = ['Approved', 'Endorsed', 'Noted', 'Not Approved', 'Not Endorsed'].includes(currentStatus);

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
  'Not Endorsed': { icon: ThumbsDown, color: 'text-red-600', text: 'Not Endorsed' },
  'Scheduled for Meeting': { icon: () => null, color: '', text: '' }
};


export function AgendaItem({ decision, objective, onDecisionUpdate }: { decision: Decision; objective?: Objective; onDecisionUpdate?: (decision: Decision) => void }) {
  const { proposalTitle, background, decisionType, status, id, submittingOrganisation, consultations } = decision;
  const isPastDecision = status !== 'Scheduled for Meeting';
  const config = statusConfig[status] || {};
  const Icon = config.icon;
  
  const handleUpdate = onDecisionUpdate || (() => {});
  
  const renderOutcomeButtons = () => {
      switch (decisionType) {
          case 'Approve':
              return (
                  <>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} currentStatus={status} outcome="Approved" variant="default"><CheckCircle className="mr-2 h-4 w-4" />Approve</OutcomeButton>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} currentStatus={status} outcome="Not Approved" variant="destructive"><XCircle className="mr-2 h-4 w-4" />Not Approve</OutcomeButton>
                  </>
              );
          case 'Endorse':
              return (
                   <>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} currentStatus={status} outcome="Endorsed"><ThumbsUp className="mr-2 h-4 w-4" />Endorse</OutcomeButton>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} currentStatus={status} outcome="Not Endorsed" variant="destructive"><ThumbsDown className="mr-2 h-4 w-4" />Not Endorse</OutcomeButton>
                  </>
              );
          case 'Agree':
              return (
                   <>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} currentStatus={status} outcome="Approved"><Handshake className="mr-2 h-4 w-4" />Agree</OutcomeButton>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} currentStatus={status} outcome="Not Approved" variant="destructive"><MinusCircle className="mr-2 h-4 w-4" />Disagree</OutcomeButton>
                  </>
              );
          case 'Note':
              return <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} currentStatus={status} outcome="Noted"><Bookmark className="mr-2 h-4 w-4" />Acknowledge as Noted</OutcomeButton>;
          case 'Direct':
              return <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} currentStatus={status} outcome="Approved" variant="default"><Check className="mr-2 h-4 w-4" />Acknowledge Directive</OutcomeButton>
          default:
              return null;
      }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div>
                <Badge variant="default" className="mb-2 text-sm py-1 px-3">{decisionType}</Badge>
                <CardTitle className="text-xl">{proposalTitle}</CardTitle>
                {submittingOrganisation && <CardDescription>Submitted by: {submittingOrganisation}</CardDescription>}
            </div>
            {isPastDecision ? (
                <div className={`flex items-center gap-2 font-semibold ${config.color}`}>
                    <Icon className="h-5 w-5" />
                    <span>{config.text}</span>
                </div>
            ) : (
                decision.alignmentScore && <StrategicAlignment score={decision.alignmentScore} />
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">Decision Sought</p>
            <p className="text-foreground p-3 bg-muted/50 rounded-lg text-sm">{decision.decision}</p>
        </div>
        
        {consultations && consultations.length > 0 && !isPastDecision && (
           <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Consultation</p>
            <ConsultationSummary consultations={consultations} />
          </div>
        )}

        {objective && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Strategic Objective</p>
            <div className="flex items-start gap-3 text-muted-foreground p-3 bg-muted/50 rounded-lg text-sm">
                <Target className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <div className="flex-1">
                <p className="font-semibold text-foreground">{objective.name}</p>
                <p>{objective.description}</p>
                </div>
            </div>
          </div>
        )}
        <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Background Summary</p>
            <p className="text-muted-foreground text-sm line-clamp-3">{background}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" disabled>
                <FileText className="mr-2 h-4 w-4"/>
                View Proposal Document
            </Button>
            {isPastDecision && (
                 <Button variant="outline" size="sm" disabled>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    View Approved Minutes
                </Button>
            )}
            {isPastDecision && (
                <Button variant="outline" size="sm" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Export Decision
                </Button>
            )}
        </div>
        {!isPastDecision && (
            <div className="flex justify-end gap-2 flex-wrap">
                {renderOutcomeButtons()}
            </div>
        )}
      </CardFooter>
    </Card>
  );
}

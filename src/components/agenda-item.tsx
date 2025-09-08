
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Decision, DecisionStatus, Objective } from '@/lib/types';
import { setDecisionOutcome } from '@/app/meeting/actions';
import { ThumbsUp, ThumbsDown, Check, Bookmark, FileCheck, FileX, Loader2, Target, FileText, Download, Handshake, MinusCircle, CheckCircle, XCircle, ClipboardList, Users, Edit, MessageSquareQuote } from 'lucide-react';
import { useTransition, useState } from 'react';
import { StrategicAlignment } from './strategic-alignment';
import { ConsultationSummary } from './consultation-summary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

type OutcomeButtonProps = {
  decision: Decision;
  outcome: DecisionStatus;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
  onDecisionUpdate: (decision: Decision) => void;
  isNegativeOutcome?: boolean;
}

function OutcomeButton({ decision, outcome, children, variant = 'outline', onDecisionUpdate, isNegativeOutcome = false }: OutcomeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [finalDecisionText, setFinalDecisionText] = useState(decision.decisionSought);
  const [decisionNote, setDecisionNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSetOutcome = async () => {
    startTransition(async () => {
      const updatedDecision = await setDecisionOutcome(decision.id, outcome, finalDecisionText, decisionNote);
      if (updatedDecision) {
        onDecisionUpdate(updatedDecision);
        setIsDialogOpen(false);
      }
    });
  };
  
  // For "Note" type, we can set the outcome directly without a dialog.
  if (decision.decisionType === 'Note') {
      return (
          <Button variant={variant} size="sm" onClick={() => handleSetOutcome()} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
        </Button>
      )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalize Decision: {outcome}</DialogTitle>
           <DialogDescription>
            {isNegativeOutcome 
                ? "Provide a clear rationale for the decision. This will be recorded and communicated to the submitter."
                : "Confirm or reframe the final decision text and add any explanatory notes as needed."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {!isNegativeOutcome && (
                <div className="space-y-2">
                    <Label htmlFor="final-decision-text">Final Decision Text</Label>
                    <Textarea
                        id="final-decision-text"
                        value={finalDecisionText}
                        onChange={(e) => setFinalDecisionText(e.target.value)}
                        rows={4}
                    />
                </div>
            )}
             <div className="space-y-2">
                <Label htmlFor="decision-note">
                    {isNegativeOutcome ? 'Rationale for non-approval' : 'Explanatory Note (Optional)'}
                </Label>
                <Textarea
                    id="decision-note"
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder={isNegativeOutcome ? 'e.g., The proposal lacks sufficient data...' : 'e.g., The decision is contingent upon...'}
                    rows={4}
                />
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
             <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSetOutcome} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Outcome
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const { proposalTitle, background, decisionType, status, id, submittingOrganisation, consultations, decisionSought, finalDecision, decisionNote } = decision;
  const isPastDecision = status !== 'Scheduled for Meeting';
  const config = statusConfig[status] || {};
  const Icon = config.icon;
  
  const handleUpdate = onDecisionUpdate || (() => {});
  
  const renderOutcomeButtons = () => {
      switch (decisionType) {
          case 'Approve':
              return (
                  <>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} outcome="Approved" variant="default"><CheckCircle className="mr-2 h-4 w-4" />Approve</OutcomeButton>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} outcome="Not Approved" variant="destructive" isNegativeOutcome={true}><XCircle className="mr-2 h-4 w-4" />Not Approve</OutcomeButton>
                  </>
              );
          case 'Endorse':
              return (
                   <>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} outcome="Endorsed"><ThumbsUp className="mr-2 h-4 w-4" />Endorse</OutcomeButton>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} outcome="Not Endorsed" variant="destructive" isNegativeOutcome={true}><ThumbsDown className="mr-2 h-4 w-4" />Not Endorse</OutcomeButton>
                  </>
              );
          case 'Agree':
              return (
                   <>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} outcome="Approved"><Handshake className="mr-2 h-4 w-4" />Agree</OutcomeButton>
                      <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} outcome="Not Approved" variant="destructive" isNegativeOutcome={true}><MinusCircle className="mr-2 h-4 w-4" />Disagree</OutcomeButton>
                  </>
              );
          case 'Note':
              return <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} outcome="Noted" variant='outline' size='sm'><Bookmark className="mr-2 h-4 w-4" />Acknowledge as Noted</OutcomeButton>;
          case 'Direct':
              return <OutcomeButton decision={decision} onDecisionUpdate={handleUpdate} outcome="Approved" variant="default"><Check className="mr-2 h-4 w-4" />Acknowledge Directive</OutcomeButton>
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
            <p className="text-sm font-semibold text-muted-foreground mb-1">
              {isPastDecision && finalDecision ? 'Final Decision' : 'Decision Sought'}
            </p>
            <p className="text-foreground p-3 bg-muted/50 rounded-lg text-sm">{isPastDecision && finalDecision ? finalDecision : decisionSought}</p>
        </div>

        {isPastDecision && decisionNote && (
            <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground mb-1">Decision Note</p>
                <div className="flex items-start gap-3 text-muted-foreground p-3 bg-muted/50 rounded-lg text-sm">
                    <MessageSquareQuote className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <p className="italic">"{decisionNote}"</p>
                </div>
            </div>
        )}
        
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

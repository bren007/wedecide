
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createDecision, type FormState } from '@/app/submit/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Upload, Target, PlusCircle, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Objective, GovernanceLevel, Consultation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Submit for Review
    </Button>
  );
}

const governanceLevels: GovernanceLevel[] = ['Project', 'Program', 'Strategic Board'];
const consultationStatuses: Consultation['status'][] = ['Supports', 'Supports with conditions', 'Neutral', 'Opposed', 'Awaiting Response'];

function ConsultationFields({ error }: { error?: string }) {
  const [consultations, setConsultations] = useState<Partial<Consultation>[]>([{}]);

  const addConsultation = () => {
    setConsultations([...consultations, {}]);
  };

  const removeConsultation = (index: number) => {
    setConsultations(consultations.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-base flex items-center gap-2"><Users className="h-5 w-5" />Consultation & Assurance</h3>
            <p className="text-sm text-muted-foreground">Record the parties consulted on this proposal.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addConsultation}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
          </Button>
      </div>
      <Separator />
      {consultations.map((consult, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 p-3 rounded-md bg-muted/50 relative">
          <Input type="hidden" name="consultationIndex" value={index} />
          <div className="space-y-1.5">
            <Label htmlFor={`consultation-party-${index}`}>Consulted Party</Label>
            <Input id={`consultation-party-${index}`} name="consultationParty" placeholder="e.g., Treasury Board" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`consultation-status-${index}`}>Status</Label>
            <Select name="consultationStatus" defaultValue="Awaiting Response">
                <SelectTrigger id={`consultation-status-${index}`}>
                    <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                    {consultationStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="md:self-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => removeConsultation(index)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove consultation</span>
              </Button>
          </div>
          <div className="md:col-span-3 space-y-1.5">
             <Label htmlFor={`consultation-comment-${index}`}>Comment (Optional)</Label>
             <Textarea id={`consultation-comment-${index}`} name="consultationComment" placeholder="Add any relevant comments..." rows={2} />
          </div>
        </div>
      ))}
      {consultations.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No consultations added.</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}


export function DecisionForm({ objectives }: { objectives: Objective[] }) {
  const initialState: FormState = {};
  const [state, dispatch] = useActionState(createDecision, initialState);
  const { toast } = useToast();
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);

  useEffect(() => {
    if (state.message) {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <form action={dispatch} className="space-y-6">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* The div wrapper is necessary to allow the tooltip to trigger on a disabled button */}
            <div className="w-full" tabIndex={0}>
              <Button variant="outline" className="w-full" disabled style={{ pointerEvents: 'none' }}>
                <Upload className="mr-2 h-4 w-4" />
                Upload decision proposal paper
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>This feature is not yet implemented in the prototype.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center">
        <div className="flex-grow border-t border-muted"></div>
        <span className="mx-4 text-xs uppercase text-muted-foreground">Or</span>
        <div className="flex-grow border-t border-muted"></div>
      </div>
      
       <div className="space-y-2">
            <Label htmlFor="governanceLevel">Governance Group</Label>
            <Select name="governanceLevel">
                <SelectTrigger id="governanceLevel">
                    <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent>
                    {governanceLevels.map(level => (
                    <SelectItem key={level} value={level}>
                        {level}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {state.errors?.governanceLevel && (
                <p className="text-sm text-destructive">{state.errors.governanceLevel.join(', ')}</p>
            )}
      </div>

      <div className="space-y-3">
        <Label id="decisionTypeLabel">Type of Decision Sought</Label>
        <RadioGroup name="decisionType" className="gap-4" aria-labelledby="decisionTypeLabel">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Approve" id="approve" />
            <Label htmlFor="approve" className="font-normal">Approve: Seek formal approval for an action or resource allocation.</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Endorse" id="endorse" />
            <Label htmlFor="endorse" className="font-normal">Endorse: Seek support or backing for a proposal or initiative.</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Agree" id="agree" />
            <Label htmlFor="agree" className="font-normal">Agree: Seek agreement on a course of action or statement.</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Direct" id="direct" />
            <Label htmlFor="direct" className="font-normal">Direct: Seek a formal instruction to undertake a specific task.</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Note" id="note" />
            <Label htmlFor="note" className="font-normal">Note: For information purposes; no formal decision required.</Label>
          </div>
        </RadioGroup>
        {state.errors?.decisionType && (
          <p className="text-sm text-destructive">{state.errors.decisionType.join(', ')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposalTitle">Proposal Title</Label>
        <Input id="proposalTitle" name="proposalTitle" placeholder="e.g., Project Phoenix Q3 Budget Allocation" />
        {state.errors?.proposalTitle && (
          <p className="text-sm text-destructive">{state.errors.proposalTitle.join(', ')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="submittingOrganisation">Submitting Organisation</Label>
        <Input id="submittingOrganisation" name="submittingOrganisation" placeholder="e.g., Digital Transformation Unit" />
        {state.errors?.submittingOrganisation && (
          <p className="text-sm text-destructive">{state.errors.submittingOrganisation.join(', ')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="decision">Decision Sought</Label>
        <Textarea
          id="decision"
          name="decision"
          placeholder="Clearly state the decision you are asking the group to make. For example: 'Approve the budget of $50,000 for the Q3 marketing campaign.'"
          rows={3}
        />
        {state.errors?.decision && (
          <p className="text-sm text-destructive">{state.errors.decision.join(', ')}</p>
        )}
      </div>
      
      <div className="space-y-3">
        <Label id="objectiveLabel">Which strategic objective does this decision align with?</Label>
        <RadioGroup 
            name="objectiveId" 
            className="grid grid-cols-1 sm:grid-cols-2 gap-4" 
            aria-labelledby="objectiveLabel"
            value={selectedObjective || ''}
            onValueChange={setSelectedObjective}
        >
          {objectives.map((objective, index) => (
            <Label 
                htmlFor={objective.id} 
                key={objective.id}
                className={cn(
                    "block rounded-lg border bg-card text-card-foreground shadow-sm transition-all cursor-pointer",
                    "hover:border-primary/80",
                    selectedObjective === objective.id && "border-primary ring-2 ring-primary/50"
                )}
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                <RadioGroupItem value={objective.id} id={objective.id} className="mt-1" />
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-base">{objective.name}</CardTitle>
                  <CardDescription className="text-xs leading-snug">{objective.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={(index + 1) * 25} className="h-2" />
              </CardContent>
            </Label>
          ))}
        </RadioGroup>
        {state.errors?.objectiveId && (
            <p className="text-sm text-destructive">{state.errors.objectiveId.join(', ')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="background">Decision Background</Label>
        <Textarea
          id="background"
          name="background"
          placeholder="Provide context, justification, and any relevant details for the proposal..."
          rows={8}
        />
        {state.errors?.background && (
          <p className="text-sm text-destructive">{state.errors.background.join(', ')}</p>
        )}
      </div>

      <ConsultationFields error={state.errors?.consultations?.join(', ')} />
      
      <div className="flex justify-end pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}

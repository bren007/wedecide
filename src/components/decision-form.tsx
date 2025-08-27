
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
import { Send, Loader2, Upload, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Objective, GovernanceLevel } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

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
      <div>
        <Button variant="outline" className="w-full" disabled>
          <Upload className="mr-2 h-4 w-4" />
          Upload decision proposal paper
        </Button>
      </div>

      <div className="flex items-center">
        <div className="flex-grow border-t border-muted"></div>
        <span className="mx-4 text-xs uppercase text-muted-foreground">Or</span>
        <div className="flex-grow border-t border-muted"></div>
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

       <div className="space-y-2">
        <Label htmlFor="submittingOrganisation">Submitting Organisation</Label>
        <Input id="submittingOrganisation" name="submittingOrganisation" placeholder="e.g., Digital Transformation Unit" />
        {state.errors?.submittingOrganisation && (
          <p className="text-sm text-destructive">{state.errors.submittingOrganisation.join(', ')}</p>
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
            <Label htmlFor="governanceLevel">Governance Level</Label>
            <Select name="governanceLevel">
                <SelectTrigger id="governanceLevel">
                    <SelectValue placeholder="Select a level..." />
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
      
      <div className="space-y-2">
        <Label htmlFor="consultedParties">Consulted Parties</Label>
        <Textarea
          id="consultedParties"
          name="consultedParties"
          placeholder="List the key departments, agencies, or external stakeholders who have been consulted on this proposal."
          rows={3}
        />
         {state.errors?.consultedParties && (
          <p className="text-sm text-destructive">{state.errors.consultedParties.join(', ')}</p>
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
      
      <div className="flex justify-end pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}

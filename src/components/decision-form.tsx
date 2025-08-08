'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createDecision, type FormState } from '@/app/submit/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Send, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Submit for Review
    </Button>
  );
}

export function DecisionForm() {
  const initialState: FormState = {};
  const [state, dispatch] = useActionState(createDecision, initialState);
  const { toast } = useToast();

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
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g., Project Phoenix Q3 Budget" />
        {state.errors?.title && (
          <p className="text-sm text-destructive">{state.errors.title.join(', ')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="background">Background</Label>
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

      <div className="space-y-3">
        <Label>Type of Decision Sought</Label>
        <RadioGroup name="decisionType" className="gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Approve" id="approve" />
            <Label htmlFor="approve" className="font-normal">Approve: Seek formal approval for an action or resource allocation.</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Endorse" id="endorse" />
            <Label htmlFor="endorse" className="font-normal">Endorse: Seek support or backing for a proposal or initiative.</Label>
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
      
      <div className="flex justify-end pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}

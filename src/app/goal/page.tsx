
'use client';
import { useState, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { AppLayout } from '@/components/app-sidebar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { startBriefingProcess } from '@/app/brief/actions';

export default function GoalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [goal, setGoal] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!goal.trim() || !user) return;
    
    startTransition(async () => {
      try {
        console.log('handleSubmit: Calling startBriefingProcess with goal:', goal);
        // 1. Call the single, consolidated server action
        const newBriefId = await startBriefingProcess(goal);

        console.log('handleSubmit: Success! Received new brief ID:', newBriefId);
        // 2. Redirect to the new brief's page
        router.push(`/brief/${newBriefId}`);

      } catch (error: any) {
        console.error('handleSubmit: Caught an error', error);
        toast({
          title: 'Error',
          description: `Failed to create the brief: ${error.message}`,
          variant: 'destructive'
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col items-center justify-center">
        <div className="w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>What is your goal?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Describe the outcome you want to achieve or the problem you are trying to solve..."
                rows={5}
                className="text-lg"
              />
              <Button onClick={handleSubmit} disabled={isPending || !goal.trim()} size="lg">
                {isPending ? 'Agent is thinking...' : 'Start Brief'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

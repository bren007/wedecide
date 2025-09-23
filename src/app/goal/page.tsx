
'use client';
import { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!goal.trim() || !user) return;
    setIsLoading(true);
    try {
      // 1. Call the single, consolidated server action
      const newBriefId = await startBriefingProcess(goal);

      // 2. Redirect to the new brief's page
      router.push(`/brief/${newBriefId}`);

    } catch (error: any) {
      console.error('Failed to generate or create brief', error);
      toast({
        title: 'Error',
        description: `Failed to create the brief: ${error.message}`,
        variant: 'destructive'
      });
      setIsLoading(false);
    }
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
              <Button onClick={handleSubmit} disabled={isLoading || !goal.trim()} size="lg">
                {isLoading ? 'Agent is thinking...' : 'Start Brief'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

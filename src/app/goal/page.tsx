'use client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateInitialBrief } from '@/ai/flows/generate-initial-brief';
import { useAuth } from '@/components/auth-provider';
import { AppLayout } from '@/components/app-sidebar';

export default function GoalPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] =useState(false);

  const handleSubmit = async () => {
    if (!goal.trim()) return;
    setIsLoading(true);
    try {
        const result = await generateInitialBrief({ goal });
        console.log(result);
        // Redirect to the brief page would happen here
    } catch(error) {
        console.error("Failed to generate brief", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
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
            />
            <Button onClick={handleSubmit} disabled={isLoading || !goal.trim()}>
              {isLoading ? 'Generating...' : 'Start Brief'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

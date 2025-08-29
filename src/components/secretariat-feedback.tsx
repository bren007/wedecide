
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquarePlus, Send, Sparkles, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SecretariatFeedback() {
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

  const handleSendFeedback = () => {
    toast({
      title: 'Feedback Sent (Simulated)',
      description: 'The proposal has been returned to the submitter with your feedback.',
    });
    setFeedback('');
  };
  
  const handleIncorporate = (type: 'assessment' | 'questions') => {
      toast({
          title: `Incorporate ${type === 'assessment' ? 'Assessment' : 'Questions'}`,
          description: `This would append the generated content to the feedback text area. (Simulated)`
      })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="text-primary" />
            Secretariat Feedback
        </CardTitle>
        <CardDescription>
          Draft feedback for the submitter. Incorporate AI-generated content to improve decision readiness.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Draft your feedback here..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={6}
        />
        <div className="grid grid-cols-1 sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={() => handleIncorporate('assessment')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Incorporate AI Assessment
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleIncorporate('questions')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Incorporate Vetting Questions
            </Button>
        </div>
        <Button onClick={handleSendFeedback} disabled={!feedback} className="w-full">
          <Send className="mr-2 h-4 w-4" />
          Send Feedback to Submitter
        </Button>
      </CardContent>
    </Card>
  );
}

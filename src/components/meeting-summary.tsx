'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMeetingSummary } from '@/ai/flows/generate-meeting-summary';
import { Loader2, Sparkles, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Decision } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Textarea } from './ui/textarea';

export function MeetingSummary({ decisions }: { decisions: Decision[] }) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary('');
    try {
      const result = await generateMeetingSummary({ decisions });
      setSummary(result.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      toast({
        title: 'Error',
        description: 'Could not generate summary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    toast({
        title: "Copied to Clipboard",
        description: "The meeting summary has been copied.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meeting Summary</CardTitle>
        <CardDescription>Generate an AI summary of all decisions made in this meeting for your records.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateSummary} disabled={isLoading || decisions.length === 0} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate AI Summary of Outcomes
        </Button>
        {isLoading && (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {summary && (
          <div className="relative">
            <Textarea
              readOnly
              value={summary}
              className="pr-10 h-48"
              aria-label="Meeting Summary"
            />
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={handleCopyToClipboard}
            >
                <Clipboard className="h-4 w-4" />
                <span className="sr-only">Copy to clipboard</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMeetingSummary } from '@/ai/flows/generate-meeting-summary';
import { Loader2, Sparkles, Clipboard, CheckCircle, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Decision } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Textarea } from './ui/textarea';
import { Label } from '@/components/ui/label';

export function MeetingSummary({ decisions }: { decisions: Decision[] }) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary('');
    setIsApproved(false);
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
  
  const handleApprove = () => {
    setIsApproved(true);
    toast({
        title: "Summary Approved",
        description: "The meeting summary has been approved and circulated.",
        variant: 'default'
    });
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Generated Meeting Minutes</CardTitle>
        <CardDescription>
            Use speech-to-text to record the meeting, then generate structured minutes. The secretariat can edit the draft before the chair gives final approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" disabled className="w-full sm:w-auto">
                <Mic className="mr-2 h-4 w-4" />
                Record Meeting
            </Button>
            <Button onClick={handleGenerateSummary} disabled={isLoading || decisions.length === 0} className="w-full sm:w-auto">
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate AI Summary
            </Button>
        </div>

        {isLoading && (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {summary && (
          <div className="space-y-4">
            <div className="relative">
                <Label htmlFor="meeting-minutes-textarea" className="text-sm font-medium">Editable Minutes Draft</Label>
                <Textarea
                id="meeting-minutes-textarea"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="pr-10 h-48 mt-2"
                aria-label="Meeting Summary"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-8 right-2 h-7 w-7"
                    onClick={handleCopyToClipboard}
                >
                    <Clipboard className="h-4 w-4" />
                    <span className="sr-only">Copy to clipboard</span>
                </Button>
            </div>
             <Button
                onClick={handleApprove}
                disabled={!summary || isApproved}
                className="w-full sm:w-auto"
                variant="default"
             >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isApproved ? 'Approved & Circulated' : 'Approve & Circulate Minutes'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

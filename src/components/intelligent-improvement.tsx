
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateImprovedContent, type GenerateImprovedContentOutput } from '@/ai/flows/generate-improved-content';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Decision } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function IntelligentImprovement({ decision }: { decision: Decision }) {
  const [suggestion, setSuggestion] = useState<GenerateImprovedContentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSuggestion = async () => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await generateImprovedContent({
        proposalTitle: decision.proposalTitle,
        decisionSought: decision.decisionSought,
        background: decision.background,
      });
      setSuggestion(result);
    } catch (error) {
      console.error('Failed to generate improvement suggestions:', error);
      toast({
        title: 'Error',
        description: 'Could not generate suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intelligent Improvement</CardTitle>
        <CardDescription>Generate AI-powered suggestions to improve the clarity and impact of this proposal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateSuggestion} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Generate Suggestions
        </Button>
        {isLoading && (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {suggestion && (
          <Accordion type="multiple" defaultValue={['decisionSought', 'background']} className="w-full pt-2">
            <AccordionItem value="decisionSought">
              <AccordionTrigger>
                <h4 className="text-sm font-semibold">Suggested Decision Sought</h4>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestion.suggestedDecisionSought}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="background">
              <AccordionTrigger>
                <h4 className="text-sm font-semibold">Suggested Background</h4>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestion.suggestedBackground}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

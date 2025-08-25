
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateFitnessReviewQuestions } from '@/ai/flows/generate-review-questions';
import { Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Decision } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function FitnessQuestions({ decision }: { decision: Decision }) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setQuestions([]);
    try {
      const result = await generateFitnessReviewQuestions({
        proposalTitle: decision.proposalTitle,
        decision: decision.decision,
        background: decision.background,
        decisionType: decision.decisionType,
      });
      setQuestions(result.questions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast({
        title: 'Error',
        description: 'Could not generate questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intelligent Vetting</CardTitle>
        <CardDescription>Generate questions to assess if this proposal is ready for consideration by decision makers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateQuestions} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Questions
        </Button>
        {isLoading && (
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 mt-1 rounded-full" />
                <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 mt-1 rounded-full" />
                <Skeleton className="h-4 flex-1" />
            </div>
          </div>
        )}
        {questions.length > 0 && (
          <Accordion type="single" collapsible defaultValue="questions" className="w-full">
            <AccordionItem value="questions">
                <AccordionTrigger>
                    <h4 className="text-sm font-semibold">Generated Vetting Questions</h4>
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="space-y-3 pt-2">
                        {questions.map((q, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <HelpCircle className="h-4 w-4 mt-1 shrink-0 text-primary" />
                            <span className="text-sm text-foreground">{q}</span>
                        </li>
                        ))}
                    </ul>
                </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

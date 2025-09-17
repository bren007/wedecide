
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateFitnessReviewQuestions, type GenerateFitnessReviewQuestionsOutput } from '@/ai/flows/generate-review-questions';
import { Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import type { Decision } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function IntelligentVetting({ decision }: { decision: Decision }) {
  const [questions, setQuestions] = useState<GenerateFitnessReviewQuestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setQuestions(null);
    try {
      const result = await generateFitnessReviewQuestions({
        proposalTitle: decision.proposalTitle,
        decision: decision.decisionSought,
        background: decision.background,
        decisionType: decision.decisionType,
      });
      setQuestions(result);
    } catch (error) {
      console.error('Failed to generate vetting questions:', error);
      toast({
        title: 'Error',
        description: 'Could not generate vetting questions. Please try again.',
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
        <CardDescription>Generate targeted questions to assess if the proposal is "decision-ready".</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateQuestions} disabled={isLoading || !decision} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Vetting Questions
        </Button>
        {isLoading && (
          <div className="space-y-4 pt-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {questions && questions.questions.length > 0 && (
          <div className="space-y-2 pt-2">
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                        <HelpCircle className="h-4 w-4 text-primary" />
                        Generated Questions
                    </h4>
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="space-y-3 pt-2">
                        {questions.questions.map((q, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <HelpCircle className="h-4 w-4 mt-1 shrink-0 text-primary" />
                            <span className="text-sm text-foreground">{q}</span>
                        </li>
                        ))}
                    </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

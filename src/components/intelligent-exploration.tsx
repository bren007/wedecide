'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateStrategicQuestions, type StrategicQuestions } from '@/ai/flows/generate-strategic-questions';
import { Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Decision } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

export function IntelligentExploration({ decisions }: { decisions: Decision[] }) {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | undefined>(undefined);
  const [questions, setQuestions] = useState<StrategicQuestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateQuestions = async () => {
    if (!selectedDecisionId) {
      toast({ title: 'Please select a decision first.', variant: 'destructive' });
      return;
    }
    const decision = decisions.find(d => d.id === selectedDecisionId);
    if (!decision) return;

    setIsLoading(true);
    setQuestions(null);
    try {
      const result = await generateStrategicQuestions({
        title: decision.title,
        background: decision.background,
        decisionType: decision.decisionType,
      });
      setQuestions(result);
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

  const selectedDecision = decisions.find(d => d.id === selectedDecisionId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          Intelligent Exploration
        </CardTitle>
        <CardDescription>Select a proposal and generate targeted questions that assist group exploration and lead to well informed decision making</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Select onValueChange={setSelectedDecisionId} value={selectedDecisionId}>
            <SelectTrigger>
                <SelectValue placeholder="Select a decision to analyze..." />
            </SelectTrigger>
            <SelectContent>
                {decisions.map(decision => (
                <SelectItem key={decision.id} value={decision.id}>
                    {decision.title}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
        <Button onClick={handleGenerateQuestions} disabled={isLoading || !selectedDecisionId} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Questions
        </Button>
        
        <div className="pt-2">
            {isLoading && <QuestionSkeleton />}
            {questions && (
                <Accordion type="multiple" className="w-full" defaultValue={Object.keys(questions)}>
                    {Object.entries(questions).map(([category, qs]) => (
                        qs.length > 0 && (
                            <AccordionItem value={category} key={category}>
                                <AccordionTrigger className="text-base font-semibold">{category}</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-3 pt-2">
                                        {qs.map((q, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <HelpCircle className="h-4 w-4 mt-1 shrink-0 text-primary" />
                                            <span className="text-sm text-foreground">{q}</span>
                                        </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    ))}
                </Accordion>
            )}
        </div>
      </CardContent>
    </Card>
  );
}


function QuestionSkeleton() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <div className="pl-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <div className="pl-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        </div>
    )
}

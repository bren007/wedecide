
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateAssessment, type GenerateAssessmentOutput } from '@/ai/flows/generate-assessment';
import { Loader2, Sparkles, ShieldCheck, TrendingUp, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import type { Decision, Objective } from '@/lib/types';
import { getObjectiveById } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function IntelligentAssessment({ decision }: { decision: Decision }) {
  const [assessment, setAssessment] = useState<GenerateAssessmentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [objective, setObjective] = useState<Objective | undefined>(undefined);

  useEffect(() => {
    if (decision) {
        getObjectiveById(decision.objectiveId).then(setObjective);
    } else {
        setObjective(undefined);
    }
    setAssessment(null);
  }, [decision]);

  const handleGenerateAssessment = async () => {
    if (!decision || !objective) {
        toast({
            title: 'Error',
            description: 'A decision with an objective must be selected to generate an assessment.',
            variant: 'destructive',
        });
        return;
    }
    setIsLoading(true);
    setAssessment(null);
    try {
      const result = await generateAssessment({
        proposalTitle: decision.proposalTitle,
        decision: decision.decision,
        background: decision.background,
        decisionType: decision.decisionType,
        objectiveName: objective.name,
        objectiveDescription: objective.description,
       });
       setAssessment(result);
    } catch (error) {
      console.error('Failed to generate assessment:', error);
      toast({
        title: 'Error',
        description: 'Could not generate the assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intelligent Assessment</CardTitle>
        <CardDescription>Generate a structured assessment of the proposal to support the vetting process.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateAssessment} disabled={isLoading || !decision || !objective} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Assessment
        </Button>
        {isLoading && (
          <div className="space-y-4 pt-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {assessment && (
          <div className="space-y-4 pt-2">
            <Accordion type="multiple" defaultValue={['summary', 'alignment', 'risk']} className="w-full">
              <AccordionItem value="summary">
                <AccordionTrigger>
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4 text-primary" />
                    Summary
                  </h4>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assessment.summary}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="alignment">
                <AccordionTrigger>
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Strategic Alignment
                  </h4>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assessment.strategicAlignment}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="risk">
                <AccordionTrigger>
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Risk Assessment
                  </h4>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assessment.riskAssessment}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

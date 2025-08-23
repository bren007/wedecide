
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { summarizeProposalBackground } from '@/ai/flows/summarize-proposal';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import type { Decision, Objective } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getObjectiveById } from '@/lib/data';


export function ProposalSummary({ decisions }: { decisions: Decision[] }) {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | undefined>(decisions.length > 0 ? decisions[0].id : undefined);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const selectedDecision = decisions.find(d => d.id === selectedDecisionId);
  const [objective, setObjective] = useState<Objective | undefined>(undefined);

  useEffect(() => {
    if (decisions.length > 0 && !selectedDecisionId) {
        setSelectedDecisionId(decisions[0].id);
    }
     if (decisions.length > 0 && selectedDecisionId === undefined) {
      setSelectedDecisionId(decisions[0].id);
    }
    if (selectedDecision) {
        getObjectiveById(selectedDecision.objectiveId).then(setObjective);
    } else {
        setObjective(undefined);
    }
    setSummary('');
  }, [selectedDecisionId, selectedDecision, decisions]);

  const handleSummarize = async () => {
    if (!selectedDecision || !objective) {
        toast({
            title: 'Error',
            description: 'A decision with an objective must be selected to generate a strategic summary.',
            variant: 'destructive',
        });
        return;
    }
    setIsLoading(true);
    setSummary('');
    try {
      const result = await summarizeProposalBackground({
        background: selectedDecision.background,
        objectiveName: objective.name,
        objectiveDescription: objective.description,
       });
      setSummary(result.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      toast({
        title: 'Error',
        description: 'Could not generate the summary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intelligent Summary</CardTitle>
        <CardDescription>Generate a concise summary of the proposal background and its strategic alignment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Select onValueChange={setSelectedDecisionId} value={selectedDecisionId}>
            <SelectTrigger>
                <SelectValue placeholder="Select a decision to summarize..." />
            </SelectTrigger>
            <SelectContent>
                {decisions.map(decision => (
                <SelectItem key={decision.id} value={decision.id}>
                    {decision.proposalTitle}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
        <Button onClick={handleSummarize} disabled={isLoading || !selectedDecision || !objective} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Summary
        </Button>
        {isLoading && (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {summary && (
          <div className="p-4 bg-muted/50 rounded-md border">
            <p className="text-sm text-foreground whitespace-pre-wrap">{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

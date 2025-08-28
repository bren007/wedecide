
'use client';

import type { Decision } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ShieldCheck, ThumbsUp, HelpCircle, ThumbsDown, MinusCircle, Clock, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

function getStatusIcon(status: string) {
  switch (status) {
    case 'Supports':
      return { icon: ThumbsUp, color: 'text-green-600', label: 'Supports' };
    case 'Supports with conditions':
      return { icon: HelpCircle, color: 'text-yellow-600', label: 'Supports with Conditions' };
    case 'Neutral':
      return { icon: MinusCircle, color: 'text-gray-500', label: 'Neutral' };
    case 'Opposed':
      return { icon: ThumbsDown, color: 'text-red-600', label: 'Opposed' };
    case 'Awaiting Response':
      return { icon: Clock, color: 'text-blue-500', label: 'Awaiting Response' };
    default:
      return { icon: HelpCircle, color: 'text-gray-500', label: 'Unknown' };
  }
}

function getAverageAlignmentForObjective(objectiveId: string, decisionBank: Decision[]): number | null {
    const relevantDecisions = decisionBank.filter(d => d.objectiveId === objectiveId && d.alignmentScore);
    if (relevantDecisions.length === 0) return null;
    const totalScore = relevantDecisions.reduce((acc, d) => acc + (d.alignmentScore || 0), 0);
    return Math.round(totalScore / relevantDecisions.length);
}


export function AssuranceGlimpse({ decisions, decisionBank }: { decisions: Decision[], decisionBank: Decision[] }) {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | undefined>(decisions.length > 0 ? decisions[0].id : undefined);

  useEffect(() => {
    if (decisions.length > 0 && !selectedDecisionId) {
      setSelectedDecisionId(decisions[0].id);
    }
  }, [decisions, selectedDecisionId]);

  const selectedDecision = useMemo(() => decisions.find(d => d.id === selectedDecisionId), [decisions, selectedDecisionId]);

  const averageAlignment = useMemo(() => {
    if (!selectedDecision) return null;
    return getAverageAlignmentForObjective(selectedDecision.objectiveId, decisionBank);
  }, [selectedDecision, decisionBank]);

  const supportingConsultations = useMemo(() => {
      if (!selectedDecision || !selectedDecision.consultations) return 0;
      return selectedDecision.consultations.filter(c => c.status === 'Supports' || c.status === 'Supports with conditions').length;
  }, [selectedDecision]);

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck />
          Assurance Glimpse
        </CardTitle>
        <CardDescription>At-a-glance confidence signals for the selected proposal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select onValueChange={setSelectedDecisionId} value={selectedDecisionId} disabled={decisions.length === 0}>
          <SelectTrigger>
            <SelectValue placeholder="Select a proposal..." />
          </SelectTrigger>
          <SelectContent>
            {decisions.map(decision => (
              <SelectItem key={decision.id} value={decision.id}>
                {decision.proposalTitle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedDecision && (
           <div className="space-y-4 pt-2">
            <div className="rounded-lg border bg-card text-card-foreground p-3 space-y-3">
                 <h4 className="text-sm font-medium">Consultation Coverage</h4>
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><ThumbsUp className="h-4 w-4" /> Supporting Parties</span>
                    <span className="font-semibold">{supportingConsultations} / {selectedDecision.consultations?.length || 0}</span>
                 </div>
                 <div className="flex flex-wrap gap-2 pt-1">
                    <TooltipProvider>
                        {selectedDecision.consultations?.map(c => {
                            const {icon: Icon, color, label} = getStatusIcon(c.status);
                            return (
                                <Tooltip key={c.party}>
                                    <TooltipTrigger>
                                        <div className="flex items-center gap-1.5 border rounded-full px-2 py-0.5 bg-background">
                                            <Icon className={`h-4 w-4 ${color}`} />
                                            <span className="text-xs">{c.party}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-semibold">{label}</p>
                                        {c.comment && <p className="text-xs italic text-muted-foreground">"{c.comment}"</p>}
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </TooltipProvider>
                 </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground p-3 space-y-3">
                <h4 className="text-sm font-medium">Strategic Precedent</h4>
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Historical Alignment</span>
                    <span className="font-semibold">{averageAlignment !== null ? `${averageAlignment}%` : 'N/A'}</span>
                 </div>
                 <p className="text-xs text-muted-foreground">
                    This compares the proposal's alignment score ({selectedDecision.alignmentScore}%) with the historical average for this objective.
                 </p>
            </div>
           </div>
        )}

         {!selectedDecision && decisions.length > 0 && (
            <div className="text-center text-sm text-muted-foreground p-4">
                <p>Select a proposal to see its assurance details.</p>
            </div>
        )}
        
        {decisions.length === 0 && (
            <div className="text-center text-sm text-muted-foreground p-4">
                <p>No proposals scheduled for a decision.</p>
            </div>
        )}

      </CardContent>
    </Card>
  );
}

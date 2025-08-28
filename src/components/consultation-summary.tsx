
'use client';

import type { Consultation } from '@/lib/types';
import { ThumbsUp, HelpCircle, ThumbsDown, MinusCircle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

function getStatusIcon(status: Consultation['status']) {
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

export function ConsultationSummary({ consultations }: { consultations: Consultation[] }) {
  if (!consultations || consultations.length === 0) {
    return null;
  }

  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {consultations.map((c, index) => {
            const { icon: Icon, color, label } = getStatusIcon(c.status);
            return (
              <Tooltip key={index}>
                <TooltipTrigger>
                  <div className="flex items-center gap-1.5 border rounded-full px-2.5 py-1 bg-background text-sm">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span>{c.party}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{label}</p>
                  {c.comment && <p className="text-xs italic text-muted-foreground">"{c.comment}"</p>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}


'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function getAlignmentColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function StrategicAlignment({ score }: { score: number }) {
  const colorClass = getAlignmentColor(score);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-16 h-8 rounded-md flex items-center justify-center font-bold text-white text-sm ${colorClass}`}
            >
              {score}
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Alignment</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Strategic Alignment Score: {score}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Decision } from '@/lib/types';
import { GitMerge } from 'lucide-react';
import Link from 'next/link';

export function RelatedDecisions({ decision, allDecisions }: { decision: Decision; allDecisions: Decision[] }) {
  const relatedDecisions = (decision.relatedDecisionIds || [])
    .map(id => allDecisions.find(d => d.id === id))
    .filter((d): d is Decision => !!d);

  if (relatedDecisions.length === 0) {
    return null; // Don't render the card if there are no related decisions
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <GitMerge className="text-primary" />
            Related Decisions
        </CardTitle>
        <CardDescription>
          Other decisions linked to this proposal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {relatedDecisions.map(related => (
            <li key={related.id} className="text-sm">
                <Link href={`/review/${related.id}`} className="font-medium text-primary hover:underline">
                    {related.proposalTitle}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{related.status}</Badge>
                    <span className="text-xs text-muted-foreground">{related.id}</span>
                </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

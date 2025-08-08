'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Decision, DecisionStatus } from '@/lib/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileSearch } from 'lucide-react';

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const statusStyles: Record<DecisionStatus, { text: string; variant: StatusVariant }> = {
  Submitted: { text: 'Submitted', variant: 'outline' },
  'In Review': { text: 'In Review', variant: 'secondary' },
  'Scheduled for Meeting': { text: 'Scheduled', variant: 'default' },
  Approved: { text: 'Approved', variant: 'default' },
  Endorsed: { text: 'Endorsed', variant: 'default' },
  Noted: { text: 'Noted', variant: 'secondary' },
  'Not Approved': { text: 'Not Approved', variant: 'destructive' },
};

function StatusBadge({ status }: { status: DecisionStatus }) {
  const { text, variant } = statusStyles[status] || { text: 'Unknown', variant: 'secondary' };
  
  const badgeClass = variant === 'default' ? 'bg-primary/80 text-primary-foreground' : '';

  return <Badge variant={variant} className={badgeClass}>{text}</Badge>;
}

export function DashboardTable({ decisions }: { decisions: Decision[] }) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[200px]">Decision Type</TableHead>
            <TableHead className="w-[200px]">Submitted</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decisions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No decisions submitted yet.
              </TableCell>
            </TableRow>
          )}
          {decisions.map(decision => (
            <TableRow key={decision.id}>
              <TableCell className="font-medium">{decision.title}</TableCell>
              <TableCell>
                <StatusBadge status={decision.status} />
              </TableCell>
              <TableCell>{decision.decisionType}</TableCell>
              <TableCell>{format(new Date(decision.submittedAt), 'PPP')}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/review/${decision.id}`}>
                    <FileSearch className="h-4 w-4" />
                    <span className="sr-only">Review</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

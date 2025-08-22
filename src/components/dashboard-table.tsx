
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Decision, DecisionStatus } from '@/lib/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileSearch, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const statusStyles: Record<DecisionStatus, { text: string; variant: StatusVariant }> = {
  Submitted: { text: 'Submitted', variant: 'outline' },
  'In Review': { text: 'In Review', variant: 'secondary' },
  'Awaiting Update': { text: 'Awaiting Update', variant: 'outline' },
  'Scheduled for Meeting': { text: 'Scheduled', variant: 'default' },
  Approved: { text: 'Approved', variant: 'default' },
  Endorsed: { text: 'Endorsed', variant: 'default' },
  Noted: { text: 'Noted', variant: 'secondary' },
  'Not Approved': { text: 'Not Approved', variant: 'destructive' },
};

function StatusBadge({ status }: { status: DecisionStatus }) {
  const { text, variant } = statusStyles[status] || { text: 'Unknown', variant: 'secondary' };
  
  let badgeClass = '';
  if (variant === 'default') {
      badgeClass = 'bg-primary/80 text-primary-foreground';
  } else if (status === 'Awaiting Update') {
      badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
  }


  return <Badge variant={variant} className={badgeClass}>{text}</Badge>;
}

function FormattedDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This now runs only on the client, avoiding the hydration mismatch.
    setFormattedDate(format(new Date(dateString), 'PPP'));
  }, [dateString]);

  // Render a placeholder on the server and initial client render
  if (!formattedDate) {
    return null;
  }

  return <>{formattedDate}</>;
}


export function DashboardTable({ decisions }: { decisions: Decision[] }) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
                <div className="flex items-center gap-2">
                    Title <Filter className="h-3 w-3" />
                </div>
            </TableHead>
            <TableHead className="w-[150px]">
                <div className="flex items-center gap-2">
                    Status <Filter className="h-3 w-3" />
                </div>
            </TableHead>
            <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                    Decision Type <Filter className="h-3 w-3" />
                </div>
            </TableHead>
            <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                    Governance Level <Filter className="h-3 w-3" />
                </div>
            </TableHead>
            <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                    Submitted <Filter className="h-3 w-3" />
                </div>
            </TableHead>
            <TableHead className="w-[150px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decisions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
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
              <TableCell>{decision.governanceLevel || 'N/A'}</TableCell>
              <TableCell>
                <FormattedDate dateString={decision.submittedAt} />
              </TableCell>
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

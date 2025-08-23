
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Decision, DecisionStatus } from '@/lib/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileSearch } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
  'Not Endorsed': { text: 'Not Endorsed', variant: 'destructive' },
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
  const allStatuses = ['Submitted', 'In Review', 'Awaiting Update', 'Scheduled for Meeting'];
  const allDecisionTypes = ['Approve', 'Endorse', 'Note', 'Agree', 'Direct'];
  const allGovernanceLevels = ['Project', 'Program', 'Strategic Board'];


  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proposal Title</TableHead>
            <TableHead className="w-[200px]">
                <Select disabled>
                    <SelectTrigger className="border-none shadow-none text-muted-foreground font-medium -ml-3 h-8">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </TableHead>
            <TableHead className="w-[200px]">
                 <Select disabled>
                    <SelectTrigger className="border-none shadow-none text-muted-foreground font-medium -ml-3 h-8">
                        <SelectValue placeholder="Decision Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {allDecisionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </TableHead>
            <TableHead className="w-[200px]">
                 <Select disabled>
                    <SelectTrigger className="border-none shadow-none text-muted-foreground font-medium -ml-3 h-8">
                        <SelectValue placeholder="Governance Level" />
                    </SelectTrigger>
                    <SelectContent>
                        {allGovernanceLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                </Select>
            </TableHead>
            <TableHead className="w-[200px]">Submitted</TableHead>
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
              <TableCell className="font-medium">{decision.proposalTitle}</TableCell>
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

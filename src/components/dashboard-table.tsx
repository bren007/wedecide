
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Decision, DecisionStatus } from '@/lib/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileSearch, ChevronRight, Clock, CheckSquare, FilePlus2, FileText, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

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
    // This hook ensures the date is only formatted on the client,
    // after hydration, preventing a mismatch with the server-rendered HTML.
    setFormattedDate(format(new Date(dateString), 'PPP'));
  }, [dateString]);

  if (!formattedDate) {
    // Return a placeholder or null during server-side rendering and initial client render.
    return <span>...</span>;
  }

  return <>{formattedDate}</>;
}


export function DashboardTable({ decisions }: { decisions: Decision[] }) {

  if (decisions.length === 0) {
    return (
        <Card className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No decisions submitted yet.</p>
        </Card>
    )
  }

  return (
    <>
      {/* Mobile & Tablet View: List of Cards */}
      <div className="space-y-4 lg:hidden">
        {decisions.map(decision => (
           <Link href={`/review/${decision.id}`} key={decision.id} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 space-y-2">
                    <p className="font-semibold text-base pr-4">{decision.proposalTitle}</p>
                    <div className="flex items-center gap-2">
                         <StatusBadge status={decision.status} />
                    </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{decision.decisionType}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{decision.governanceLevel || 'N/A'}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <FormattedDate dateString={decision.submittedAt} />
                     </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
           </Link>
        ))}
      </div>
      
      {/* Desktop View: Table */}
      <div className="hidden lg:block border rounded-md relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[250px] font-semibold">Proposal Title</TableHead>
              <TableHead className="w-[150px]">
                  Status
              </TableHead>
              <TableHead className="w-[180px]">
                   Decision Type
              </TableHead>
              <TableHead className="w-[180px]">
                   Governance Level
              </TableHead>
              <TableHead className="w-[150px]">Submitted</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
    </>
  );
}

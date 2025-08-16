
'use client';

import { getDecisions, getObjectives } from '@/lib/data';
import { AgendaItem } from '@/components/agenda-item';
import { IntelligentExploration } from '@/components/intelligent-exploration';
import { Card } from '@/components/ui/card';
import { ProposalSummary } from '@/components/proposal-summary';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MeetingModeToggle } from '@/components/meeting-mode-toggle';
import type { Decision, Objective } from '@/lib/types';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { cn } from '@/lib/utils';


export default function MeetingPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingMode, setMeetingMode] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [allDecisions, allObjectives] = await Promise.all([
        getDecisions(),
        getObjectives()
      ]);
      setDecisions(allDecisions);
      setObjectives(allObjectives);
      setLoading(false);
    }
    fetchData();
  }, []);

  const scheduledDecisions = decisions.filter(d => d.status === 'Scheduled for Meeting');

  if (loading) {
    return (
      <>
        <div className="hidden">
          <Sidebar>
            <AppSidebar />
          </Sidebar>
        </div>
        <SidebarInset>
          <div className="p-8"><Skeleton className="h-96 w-full" /></div>
        </SidebarInset>
      </>
    )
  }

  return (
    <>
      <div className={cn(meetingMode && 'hidden')}>
        <Sidebar>
          <AppSidebar />
        </Sidebar>
      </div>
      <SidebarInset className={cn(meetingMode && "ml-0")}>
        <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Meeting Agenda</h1>
              <p className="text-muted-foreground">Review and finalize decisions for the current meeting.</p>
            </div>
            <MeetingModeToggle isEnabled={meetingMode} onToggle={setMeetingMode} />
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-semibold tracking-tight">Scheduled for Decision</h2>
                {scheduledDecisions.length > 0 ? (
                  scheduledDecisions.map(decision => (
                    <AgendaItem key={decision.id} decision={decision} objective={objectives.find(o => o.id === decision.objectiveId)} />
                  ))
                ) : (
                  <Card className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No decisions currently scheduled for meeting.</p>
                  </Card>
                )}
              </div>
              <div className="lg:col-span-1 space-y-6 sticky top-8">
                <h2 className="text-xl font-semibold tracking-tight">Decision Support</h2>
                <ProposalSummary decisions={scheduledDecisions} />
                <IntelligentExploration decisions={scheduledDecisions} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

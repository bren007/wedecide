
'use client';

import { getDecisions, getObjectives } from '@/lib/data';
import { AgendaItem } from '@/components/agenda-item';
import { IntelligentExploration } from '@/components/intelligent-exploration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalSummary } from '@/components/proposal-summary';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MeetingModeToggle } from '@/components/meeting-mode-toggle';
import type { Decision, Objective } from '@/lib/types';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Users, User, FileSignature } from 'lucide-react';
import { MeetingSummary } from '@/components/meeting-summary';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AssuranceGlimpse } from '@/components/assurance-glimpse';


export default function MeetingPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingMode, setMeetingMode] = useState(false);
  const { toast } = useToast();

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
  
  const handleDecisionUpdate = (updatedDecision: Decision) => {
    setDecisions(prevDecisions => 
      prevDecisions.map(d => d.id === updatedDecision.id ? updatedDecision : d)
    );
     toast({
        title: "Decision Recorded",
        description: `The outcome for "${updatedDecision.proposalTitle}" has been set to ${updatedDecision.status}.`,
    });
  };

  const scheduledDecisions = decisions.filter(d => d.status === 'Scheduled for Meeting');
  const pastDecisions = decisions.filter(d => ['Approved', 'Endorsed', 'Noted', 'Not Approved', 'Not Endorsed'].includes(d.status));
  const decisionBank = decisions.filter(d => ['Approved', 'Endorsed', 'Noted', 'Not Approved', 'Not Endorsed'].includes(d.status));


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

          <Card>
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-3 p-2">
                    <Users className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-xs text-muted-foreground">Decision Group</p>
                        <p className="font-semibold">Strategic Board</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-xs text-muted-foreground">Meeting Date</p>
                        <p className="font-semibold">October 26, 2023</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 p-2">
                    <Clock className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-xs text-muted-foreground">Meeting Time</p>
                        <p className="font-semibold">10:00 AM - 12:00 PM</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-2">
                    <User className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-xs text-muted-foreground">Attendees</p>
                        <p className="font-semibold">Jane Doe (Chair)</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-semibold tracking-tight">Scheduled for Decision</h2>
                {scheduledDecisions.length > 0 ? (
                  scheduledDecisions.map(decision => (
                    <AgendaItem key={decision.id} decision={decision} objective={objectives.find(o => o.id === decision.objectiveId)} onDecisionUpdate={handleDecisionUpdate} />
                  ))
                ) : (
                  <Card className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No decisions currently scheduled for meeting.</p>
                  </Card>
                )}
              </div>
              <div className="lg:col-span-1 space-y-6 sticky top-8">
                <h2 className="text-xl font-semibold tracking-tight">Decision Support</h2>
                <AssuranceGlimpse decisions={scheduledDecisions} decisionBank={decisionBank} />
                <ProposalSummary decisions={scheduledDecisions} />
                <IntelligentExploration decisions={scheduledDecisions} />
              </div>
            </div>

            {pastDecisions.length > 0 && (
                <div className="space-y-6">
                    <Separator />
                    <div className="flex items-center gap-2">
                        <FileSignature className="h-6 w-6" />
                        <h2 className="text-xl font-semibold tracking-tight">Meeting Minutes</h2>
                    </div>
                    <MeetingSummary decisions={pastDecisions} />
                </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

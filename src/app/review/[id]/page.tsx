

import { getDecisionById, getObjectiveById, getDecisions } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { approveForMeeting } from './actions';
import { IntelligentAssessment } from '@/components/intelligent-assessment';
import { FitnessQuestions } from '@/components/fitness-questions';
import { RelatedDecisions } from '@/components/related-decisions';
import { StrategicAlignment } from '@/components/strategic-alignment';
import { CheckCircle2, Target, FileText, Download, ClipboardList, ThumbsUp, HelpCircle, ThumbsDown, MinusCircle, Clock, Menu } from 'lucide-react';
import { Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SecretariatFeedback } from '@/components/secretariat-feedback';
import type { Consultation } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const decision = await getDecisionById(params.id);

  if (!decision) {
    notFound();
  }

  const allDecisions = await getDecisions();
  const objective = await getObjectiveById(decision.objectiveId);

  const canApprove = decision.status === 'Submitted' || decision.status === 'In Review' || decision.status === 'Awaiting Update';
  const isPastDecision = ['Approved', 'Endorsed', 'Noted', 'Not Approved', 'Not Endorsed'].includes(decision.status);


  return (
    <>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-4 p-2 md:p-0 bg-background md:bg-transparent rounded-lg">
                <div className="md:hidden">
                    <SidebarTrigger />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">Review Proposal</h1>
            </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline">{decision.decisionType}</Badge>
                        {decision.governanceLevel && <Badge variant="secondary">{decision.governanceLevel}</Badge>}
                      </div>
                      <CardTitle className="text-2xl">{decision.proposalTitle}</CardTitle>
                      {decision.submittingOrganisation && <CardDescription>Submitted by: {decision.submittingOrganisation}</CardDescription>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <form action={approveForMeeting.bind(null, decision.id)}>
                            <Button type="submit" disabled={!canApprove} className="w-full">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve for Meeting
                            </Button>
                        </form>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2 text-lg">Decision Sought</h3>
                    <p className="text-muted-foreground p-4 bg-muted/50 rounded-lg">{decision.decisionSought}</p>
                  </div>

                  {objective && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2 text-lg">Strategic Objective</h3>
                      <div className="flex items-start gap-3 text-muted-foreground p-4 bg-muted/50 rounded-lg">
                        <Target className="h-5 w-5 mt-1 shrink-0 text-primary" />
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{objective.name}</p>
                          <p className="text-sm">{objective.description}</p>
                        </div>
                        {decision.alignmentScore && <StrategicAlignment score={decision.alignmentScore} />}
                      </div>
                    </div>
                  )}

                  {decision.consultations && decision.consultations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2 text-lg">Consultation & Assurance</h3>
                       <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                         <TooltipProvider>
                           {decision.consultations.map((consultation, index) => {
                             const { icon: Icon, color, label } = getStatusIcon(consultation.status);
                             return (
                               <div key={index} className="flex items-start gap-4">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{label}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                 <div className="flex-1">
                                   <p className="font-semibold text-foreground">{consultation.party}</p>
                                   {consultation.comment && <p className="text-sm text-muted-foreground italic">"{consultation.comment}"</p>}
                                 </div>
                               </div>
                             );
                           })}
                         </TooltipProvider>
                      </div>
                    </div>
                  )}

                  <h3 className="font-semibold mb-2 text-lg">Background</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{decision.background}</p>
                </CardContent>
                <CardFooter className="gap-2 flex-wrap">
                     <Button variant="outline" disabled>
                        <FileText className="mr-2 h-4 w-4"/>
                        View Proposal Document
                    </Button>
                    {isPastDecision && (
                         <Button variant="outline" disabled>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            View Approved Minutes
                        </Button>
                    )}
                    <Button variant="outline" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Export Decision
                    </Button>
                </CardFooter>
              </Card>
              <div className="lg:hidden space-y-6">
                <IntelligentAssessment decision={decision} />
                <FitnessQuestions decision={decision} />
                <SecretariatFeedback />
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6 hidden lg:block">
                <IntelligentAssessment decision={decision} />
                <FitnessQuestions decision={decision} />
                <SecretariatFeedback />
                <RelatedDecisions decision={decision} allDecisions={allDecisions} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, CheckCircle, Clock, FileText, Briefcase, MessageSquare, Users, PenSquare, Paperclip, SlidersHorizontal, BookCheck, Landmark, BarChart, GitCommitHorizontal, Forward, PlusCircle, History, RotateCcw, Zap, Link2, TrendingUp, Send, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { strategicOutcomes } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// Mock Data
const userGoal = "I need to produce a business case for the procurement of new software to manage public feedback, and I need it ready for the CEO's committee next month.";

const agentQuestions = [
  { category: 'Strategic Outcomes', question: 'Which strategic outcomes—"Improve Citizen Service Score by 15%" or "Reduce Carbon Footprint by 20%"—does this software procurement best support? You can select multiple and provide a rationale.' },
  { category: 'Scope and Constraints', question: 'Is this business case just for the initial software procurement, or should it also cover the multi-year implementation and training plan?' },
  { category: 'Data and Information Gaps', question: 'To build the case, should I reference the "2023 Citizen Satisfaction Survey" and the "Current IT Infrastructure Cost Report"?' },
  { category: 'Audience and Purpose', question: 'Who is the final decision-maker for this business case (e.g., the CEO, the CTO, or the Board), and what is the primary action you want them to take?' },
];

const ragSources = [
  { id: 'policy-archive', name: 'Policy Archive' },
  { id: 'budget-docs', name: 'Current Budget Docs', checked: true },
  { id: 'project-reports', name: 'Historical Project Reports', checked: true },
  { id: 'satisfaction-survey', name: '2023 Citizen Satisfaction Survey', checked: true },
  { id: 'it-cost-report', name: 'Current IT Infrastructure Cost Report', checked: true },
];

const reviewStakeholders = [
    { name: 'Digital Services Team', status: 'Feedback Submitted' },
    { name: 'External Citizen Advisory Panel', status: 'Pending' },
];

const endorsementStakeholders = [
    { name: 'Finance Department', status: 'Endorsed', feedback: 'Financial model is sound.' },
    { name: 'IT Security', status: 'Feedback Provided', feedback: 'Requires MFA integration.' },
    { name: 'Legal & Compliance', status: 'Endorsed', feedback: 'No concerns.' },
];

const assuranceReview = {
    name: 'Gateway Review 0: Strategic Assessment',
    outcome: 'Amber/Green',
    recommendation: 'The business case is viable, but the project team must strengthen the change management and benefits realisation plan before proceeding to the next stage.'
}


// --- SCREEN COMPONENTS ---

function Screen1_AgentIntake({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to WeDecide</h1>
            <p className="text-muted-foreground mt-2">The intelligent operating system for public sector governance.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Strategic Outcomes</CardTitle>
                <CardDescription>All decisions should align with one or more of these core organizational outcomes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {strategicOutcomes.map(goal => (
                    <Card key={goal.id} className="p-4">
                        <h4 className="font-semibold">{goal.name}</h4>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </Card>
                ))}
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Start with your Goal</CardTitle>
          <CardDescription>Enter your goal, request, or problem statement in natural language.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            defaultValue={userGoal}
            className="text-base p-4"
            rows={3}
          />
           <Button onClick={onNext} className="w-full">
              Submit Goal <ArrowRight className="ml-2" />
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Screen2_ClarifyingQuestions({ onNext }: { onNext: () => void }) {
  const [questionsToShow, setQuestionsToShow] = useState(0);
  const [clarificationsSubmitted, setClarificationsSubmitted] = useState(false);
  const allQuestionsShown = questionsToShow === agentQuestions.length;

  useEffect(() => {
    if (!allQuestionsShown) {
      const timer = setTimeout(() => {
        setQuestionsToShow(prev => prev + 1);
      }, 1500); // 1.5 second delay between questions
      return () => clearTimeout(timer);
    }
  }, [questionsToShow, allQuestionsShown]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Clarifying Intent</h1>
          <p className="text-muted-foreground mt-2">The agent is analyzing your goal and generating questions to ensure the best possible output.</p>
      </div>
      <Card>
          <CardHeader>
              <CardTitle>Your Goal</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-base p-4 bg-muted/50 rounded-md">"{userGoal}"</p>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Goal Clarification</CardTitle>
            <CardDescription>Please provide responses to the following questions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {agentQuestions.slice(0, questionsToShow).map((q) => (
                 <div key={q.category} className="space-y-3 animate-in fade-in duration-1000">
                    <Label className="font-semibold text-primary">{q.category}</Label>
                    <p className="font-medium p-4 border rounded-md bg-muted/30">{q.question}</p>
                    <Textarea placeholder="Your response..." />
                </div>
            ))}
            {!allQuestionsShown && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-primary"></div>
                    <span>Agent is thinking...</span>
                </div>
            )}
            {allQuestionsShown && !clarificationsSubmitted && (
                 <Button onClick={() => setClarificationsSubmitted(true)} className="w-full animate-in fade-in duration-500">
                    Submit Responses
                </Button>
            )}
        </CardContent>
      </Card>
      
      {clarificationsSubmitted && (
        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle>Confirm Knowledge Sources</CardTitle>
            <CardDescription>The agent has suggested these sources based on your goal and clarifications. Please confirm or adjust.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ragSources.map(source => (
              <div key={source.id} className="flex items-center space-x-3">
                <Checkbox id={source.id} defaultChecked={source.checked} />
                <Label htmlFor={source.id} className="font-medium">{source.name}</Label>
              </div>
            ))}
             <Button variant="outline" className="w-full mt-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                Connect Source
            </Button>
          </CardContent>
          <CardContent>
            <Button onClick={onNext} className="w-full">
              Generate Draft Decision Product <ArrowRight className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Screen3_DraftGeneration({ onNext }: { onNext: () => void }) {
    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
             <div className="text-center">
                <Badge>Your Role: Preparer</Badge>
                <h1 className="text-3xl font-bold tracking-tight mt-2">Draft: Business Case for Public Feedback Software</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">You are now viewing the agent-generated draft. Your role is to collaborate with your team and the agent to refine this document until it's ready for formal consultation.</p>
            </div>
            
             <div className="flex justify-center items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" />
                    <span className="font-semibold">Strategic Alignment Score:</span>
                    <Badge variant="outline" className="text-lg font-bold border-green-500 text-green-500">85%</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Clock />
                    <span className="font-semibold">Est. Decision Cycle:</span>
                    <Badge variant="outline" className="text-lg font-bold">12 Days</Badge>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-3 lg:col-span-2 space-y-6">
                     <Tabs defaultValue="brief" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="brief"><Briefcase className="mr-2"/>Decision Brief</TabsTrigger>
                            <TabsTrigger value="artifact"><FileText className="mr-2"/>Full Decision Product</TabsTrigger>
                        </TabsList>
                        <TabsContent value="brief">
                            <Card>
                                <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    <p>This business case seeks committee approval for the procurement of a new software-as-a-service (SaaS) solution to systematically manage public feedback, suggestions, and complaints. The proposed investment directly supports the strategic outcome to **"Improve Citizen Service Score by 15%"** by addressing critical deficiencies in our current manual and fragmented processes. It will streamline intake, enable faster response times, and provide robust analytics for continuous service improvement, thereby enhancing public trust and operational efficiency.</p>
                                    <Separator />
                                    <h4 className="font-semibold text-foreground">Recommendation:</h4>
                                    <p>It is recommended that the committee **approve** the allocation of **$250,000** from the IT Modernization Fund to procure and implement the 'CivicEngage' platform. This option represents the best value by offering rapid time-to-value, lower maintenance overhead compared to an in-house build, and adherence to modern security standards, with a target go-live date of Q2 2025.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="artifact">
                            <Card>
                                 <CardHeader><CardTitle>Full Business Case: Public Feedback Software</CardTitle></CardHeader>
                                <CardContent className="space-y-6 text-sm text-muted-foreground">
                                    <div>
                                        <h4 className="font-semibold text-foreground">1. Strategic Case</h4>
                                        <p>The organization's strategic plan prioritizes improving citizen service delivery. The current method of handling public feedback via disconnected email inboxes and spreadsheets is inefficient, prone to error, and provides zero actionable insight. This project directly addresses this gap by creating a centralized system of record, aligning with the "Improve Citizen Service Score by 15%" outcome by enabling data-driven service design and accountability.</p>
                                    </div>
                                     <div>
                                        <h4 className="font-semibold text-foreground">2. Economic Case</h4>
                                        <p>An analysis of options indicates that procuring a SaaS solution offers the most compelling economic benefit. While a 'do nothing' approach avoids initial outlay, it carries the unquantified but significant cost of reputational damage and missed service improvements. The recommended SaaS option provides a positive net present value (NPV) over five years, factoring in productivity gains from staff time saved on manual processing.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">3. Commercial Case</h4>
                                        <p>A market scan identified three viable SaaS vendors. The recommended 'CivicEngage' platform is a leader in the government technology space, offering a competitive pricing structure and a robust feature set that meets 95% of our requirements out-of-the-box. The proposed contract is a standard three-year enterprise license with favorable terms for data ownership and exit.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">4. Financial Case</h4>
                                        <p>The total cost of ownership over 3 years for the recommended solution is estimated at $250,000, funded from the approved IT Modernization Fund (Ref: B-2024-04). This includes one-time setup fees ($50,000) and recurring license fees ($200,000). The investment is projected to deliver productivity savings of $80,000 per annum, resulting in a payback period of approximately 3.1 years.</p>
                                    </div>
                                     <div>
                                        <h4 className="font-semibold text-foreground">5. Management Case</h4>
                                        <p>The project will be managed by the Digital Services team, with a dedicated project manager assigned. A detailed project plan, including risk register and stakeholder communication plan, has been prepared. Governance will be overseen by the existing Digital Transformation Steering Committee, with quarterly progress reports provided to the board. Successful implementation is highly probable given the vendor's strong track record and our internal project management expertise.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="col-span-3 lg:col-span-1 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Paperclip className="mr-2"/>Knowledge Sources</CardTitle>
                            <CardDescription>Add or change the RAG data sources to refine the draft.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {ragSources.map(source => (
                                <div key={source.id} className="flex items-center space-x-3">
                                    <Checkbox id={`draft-${source.id}`} defaultChecked={source.checked} />
                                    <Label htmlFor={`draft-${source.id}`} className="text-sm">{source.name}</Label>
                                </div>
                            ))}
                            <Button variant="outline" className="mt-2 w-full">Update Sources</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><PenSquare className="mr-2"/>Agent Collaboration & Audit Trail</CardTitle>
                    <CardDescription>Provide guidance to the agent to refine the draft and review the history of changes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea placeholder="e.g., 'Flesh out the risk analysis section with more detail on data security and vendor lock-in.'" rows={3}/>
                    <Button className="mt-2 w-full">Send Guidance to Agent</Button>
                </CardContent>
                <CardContent className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center"><History className="mr-2"/>Audit Trail</h4>
                     <div className="text-xs text-muted-foreground space-y-3">
                        <div>
                            <p><span className="font-semibold text-foreground">V3 (Current):</span> Added detail to the Financial Case per user instruction.</p>
                            <p className="text-xs pl-4">- Instruction: "The financial case is too light. Add more detail on projected savings."</p>
                        </div>
                         <div>
                            <p><span className="font-semibold text-foreground">V2:</span> Expanded the options analysis section.</p>
                            <p className="text-xs pl-4">- Instruction: "Include an in-house build as a formal option in the analysis."</p>
                        </div>
                        <div>
                            <p><span className="font-semibold text-foreground">V1:</span> Initial draft generated by agent.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Button onClick={onNext} className="w-full" size="lg">Mark as Ready for Consultation <ArrowRight className="ml-2"/></Button>
        </div>
    );
}

function Screen4_Consultation({ onNext }: { onNext: () => void }) {
    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="text-center">
                <Badge>Your Role: Preparer</Badge>
                <h1 className="text-3xl font-bold tracking-tight mt-2">Consultation & Assurance</h1>
                <p className="text-muted-foreground max-w-3xl mx-auto">Manage feedback, endorsement, and formal assurance from stakeholders before proceeding to governance.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center"><Users className="mr-2"/>Stakeholder Review & Feedback</CardTitle>
                        <Button variant="outline"><Send className="mr-2"/>Initiate Review Cycle</Button>
                    </div>
                    <CardDescription>Circulate the draft to relevant internal and external stakeholders for their feedback and comments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {reviewStakeholders.map((stakeholder) => (
                            <div key={stakeholder.name} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <p className="font-medium">{stakeholder.name}</p>
                                <Badge variant={stakeholder.status === 'Feedback Submitted' ? 'default' : 'secondary'} className={stakeholder.status === 'Feedback Submitted' ? 'bg-blue-100 text-blue-800' : ''}>
                                    {stakeholder.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ClipboardCheck className="mr-2"/>Required Endorsements</CardTitle>
                    <CardDescription>Track formal endorsement from mandatory stakeholders whose approval is required to proceed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {endorsementStakeholders.map((stakeholder) => (
                            <div key={stakeholder.name} className="flex items-start justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-semibold">{stakeholder.name}</h4>
                                    {stakeholder.feedback && <p className="text-sm text-muted-foreground mt-1">"{stakeholder.feedback}"</p>}
                                </div>
                                <Badge variant={
                                    stakeholder.status === 'Endorsed' ? 'default' :
                                    stakeholder.status === 'Pending' ? 'secondary' : 'outline'
                                }
                                className={
                                     stakeholder.status === 'Endorsed' ? 'bg-green-100 text-green-800' :
                                     stakeholder.status === 'Feedback Provided' ? 'bg-yellow-100 text-yellow-800' : ''
                                }
                                >{stakeholder.status}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ShieldCheck className="mr-2"/>Independent Assurance</CardTitle>
                    <CardDescription>Record the outcome of formal, independent assurance reviews (e.g., Gateway Reviews, security assessments).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">{assuranceReview.name}</h4>
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{assuranceReview.outcome}</Badge>
                        </div>
                        <Separator className="my-3"/>
                        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Key Recommendation:</span> {assuranceReview.recommendation}</p>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={onNext} className="w-full" size="lg">Submit to Governance Secretariat <ArrowRight className="ml-2"/></Button>
        </div>
    );
}


function Screen5_GovernanceHandoff({ onNext }: { onNext: () => void }) {
    return (
         <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="text-center">
                <Badge>Your Role: Secretariat / Governance</Badge>
                <h1 className="text-3xl font-bold tracking-tight mt-2">Governance Review</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">This is the final quality and coordination gate. Review the brief, check consultation, and decide if it is ready for the decision-making body.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Tabs defaultValue="brief" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="brief"><Briefcase className="mr-2"/>Decision Brief</TabsTrigger>
                            <TabsTrigger value="artifact"><FileText className="mr-2"/>Full Decision Product</TabsTrigger>
                        </TabsList>
                        <TabsContent value="brief">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Business Case for Public Feedback Software</CardTitle>
                                    <CardDescription>Decision Sought: <span className="font-semibold text-foreground">Approve</span></CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    <p>This business case seeks committee approval for the procurement of a new software-as-a-service (SaaS) solution to systematically manage public feedback. The investment directly supports the strategic outcome to **"Improve Citizen Service Score by 15%"**.</p>
                                    <Separator/>
                                    <h4 className="font-semibold text-foreground">Recommendation:</h4>
                                    <p>It is recommended that the committee **approve** the allocation of **$250,000** from the IT Modernization Fund to procure and implement the 'CivicEngage' platform, targeting a go-live date of Q2 2025.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="artifact">
                            <Card>
                                 <CardHeader><CardTitle>Full Business Case</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">[The full, 5-case business case document would be displayed here for detailed review.]</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Users className="mr-2"/>Consultation & Endorsement</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {endorsementStakeholders.slice(0, 2).map((stakeholder) => (
                                <div key={stakeholder.name} className="flex items-center justify-between text-sm">
                                    <p className="font-medium">{stakeholder.name}</p>
                                    <Badge variant={'default'} className={'bg-green-100 text-green-800'}>
                                        Endorsed
                                    </Badge>
                                </div>
                           ))}
                            <div className="flex items-center justify-between text-sm">
                                <p className="font-medium">IT Security</p>
                                <Badge variant={'outline'} className={'bg-yellow-100 text-yellow-800'}>
                                    Feedback
                                </Badge>
                            </div>
                           <div className="text-sm flex items-center justify-between font-medium text-muted-foreground">
                                <p>Ext. Citizen Panel</p>
                                <Badge variant="secondary">Pending</Badge>
                           </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><GitCommitHorizontal className="mr-2"/>Governance Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full justify-start" variant="destructive">
                                <RotateCcw className="mr-2"/> Return for Update
                            </Button>
                            <Button className="w-full justify-start" onClick={onNext}>
                                <CheckCircle className="mr-2"/> Approve & Schedule for Meeting
                            </Button>
                             <p className="text-xs text-muted-foreground px-1 pt-1">
                                This will lock the document and schedule it for the next available "CEO Committee" meeting.
                             </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Screen6_DecisionHub({ onNext }: { onNext: () => void }) {
    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            <div className="text-center md:text-left">
                <Badge>Your Role: Decision-Maker</Badge>
                <p className="text-primary font-semibold mt-2">CEO Committee Meeting: 15 Oct 2024</p>
                <h1 className="text-3xl font-bold tracking-tight">Decision Intelligence Hub</h1>
                <p className="text-muted-foreground max-w-3xl mx-auto md:mx-0">This is the central space for decision-makers to review materials, explore scenarios, and capture outcomes.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Main Decision Brief */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Decision Brief: Business Case for Public Feedback Software</CardTitle>
                            <CardDescription>Authored by Sarah Chen | Decision Sought: <span className="font-semibold text-foreground">Approve</span></CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>This business case seeks approval for the procurement of a new SaaS solution to manage public feedback. The proposed solution directly supports the strategic objective to "Improve Citizen Service Score by 15%" by streamlining intake, enabling faster response times, and providing robust analytics for service improvement.</p>
                            <h4 className="font-semibold text-foreground">Recommendation:</h4>
                            <p>It is recommended that the committee approve the allocation of $250,000 from the IT Modernization Fund to procure and implement the 'CivicEngage' platform, with a target go-live date of Q2 2025.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Intelligence Deck */}
                <div className="space-y-6">
                    <Tabs defaultValue="scenario" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="scenario"><Zap className="mr-1.5"/>Scenarios</TabsTrigger>
                            <TabsTrigger value="predict"><TrendingUp className="mr-1.5"/>Predict</TabsTrigger>
                            <TabsTrigger value="deps"><Link2 className="mr-1.5"/>Deps</TabsTrigger>
                        </TabsList>
                        <TabsContent value="scenario">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Scenario Explorer</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>What if we reduced the budget by 20%?</Label>
                                        <Textarea className="mt-1 text-xs" readOnly value="Reducing the budget to $200,000 would likely require descoping the project to exclude the 'Advanced Analytics' module. This would impact our ability to generate deep insights and may delay achieving the full 15% service score improvement."/>
                                    </div>
                                    <div>
                                        <Label>What is the biggest implementation risk?</Label>
                                        <Textarea className="mt-1 text-xs" readOnly value="The primary risk is user adoption. A comprehensive change management and training plan, included in the full budget, is critical to mitigate this. Without it, the new tool may be underutilized, limiting ROI."/>
                                    </div>
                                    <Separator />
                                     <div>
                                        <Label>Budget Adjustment</Label>
                                        <Slider defaultValue={[50]} />
                                        <div className="text-xs flex justify-between text-muted-foreground"><span>-$50k</span><span>$250k</span><span>+$50k</span></div>
                                    </div>
                                     <div>
                                        <Label>Timeline Adjustment</Label>
                                        <Slider defaultValue={[50]} />
                                        <div className="text-xs flex justify-between text-muted-foreground"><span>-3 mos</span><span>12 mos</span><span>+3 mos</span></div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="predict">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Predictive Insights</CardTitle>
                                    <CardDescription>Based on 52 similar past decisions.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">Success Probability</p>
                                        <p className="text-4xl font-bold text-green-600">88%</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="font-semibold text-sm">Key Risk Factors Identified:</h4>
                                        <ul className="list-disc pl-4 text-xs text-muted-foreground mt-2 space-y-1">
                                            <li><span className="font-semibold text-foreground">Vendor Lock-in:</span> Similar SaaS procurements have a 35% chance of incurring significant switching costs after 3 years.</li>
                                            <li><span className="font-semibold text-foreground">User Adoption:</span> Projects without a dedicated Change Manager have a 50% lower ROI.</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="deps">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Decision Dependencies</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="text-sm p-3 rounded-md border bg-muted/50">
                                        <p className="font-semibold">Dependent On:</p>
                                        <p className="text-muted-foreground">Approval of 'IT Modernization Fund' (Status: <span className="text-green-600 font-medium">Approved</span>)</p>
                                    </div>
                                    <div className="text-sm p-3 rounded-md border bg-muted/50">
                                        <p className="font-semibold">Blocks:</p>
                                        <p className="text-muted-foreground">Decommission of 'Legacy Feedback System' (Status: <span className="font-medium">Pending</span>)</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Full-width cards below the main grid */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><TrendingUp className="mr-2" />Strategic Impact</CardTitle>
                </CardHeader>
                <CardContent>
                    <Label>Progress Towards: "Improve Citizen Service Score by 15%"</Label>
                    <Progress value={73} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">Current Progress: 11% / 15% (On Track). This decision is forecast to contribute a <span className="font-bold text-green-600">2%</span> improvement.</p>
                </CardContent>
            </Card>

            <Button onClick={onNext} className="w-full" size="lg">Capture Decision <ArrowRight className="ml-2"/></Button>
        </div>
    );
}


function Screen7_DecisionCapture({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="text-center">
            <Badge>Your Role: Secretariat / Chair</Badge>
            <h1 className="text-3xl font-bold tracking-tight mt-2">Capture & Formalize Decision</h1>
            <p className="text-muted-foreground">Record the outcome for the Business Case for Public Feedback Software.</p>
        </div>
        

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><BookCheck className="mr-2" />Final Decision</CardTitle>
                <CardDescription>Select the final outcome based on the committee's decision.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Select defaultValue="approved">
                    <SelectTrigger className="text-base h-12">
                        <SelectValue placeholder="Select decision outcome..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="endorsed">Endorsed</SelectItem>
                        <SelectItem value="noted">Noted</SelectItem>
                        <SelectItem value="not-approved">Not Approved</SelectItem>
                    </SelectContent>
                </Select>
                 <Textarea placeholder="Add any final decision notes or directives... (e.g., 'The committee approves the recommendation, with the condition that the project team provides quarterly progress reports to the board.')" rows={4}/>
                 <p className="text-xs text-muted-foreground">
                    Governance approach for this committee is configured to: <span className="font-semibold text-foreground">Consensus</span>.
                 </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><FileText className="mr-2" />Auto-Generated Minutes Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6 border rounded-lg bg-muted/30 text-sm space-y-4">
                <h4 className="font-bold">Minutes of the CEO Committee - 15 October 2024</h4>
                <p><span className="font-semibold">Attendees:</span> J. Smith (Chair), D. Miller, A. White, L. Green.</p>
                <Separator/>
                <h4 className="font-semibold">Decision Item: Business Case for Public Feedback Software</h4>
                <p><span className="font-semibold">Outcome:</span> <span className="text-green-700 font-bold">Approved</span></p>
                <p><span className="font-semibold">Decision:</span> The committee approves the recommendation to allocate $250,000 from the IT Modernization Fund to procure and implement the 'CivicEngage' platform, with a target go-live date of Q2 2025.</p>
                <p><span className="font-semibold">Directive:</span> The project team is required to provide quarterly progress reports to the board.</p>
            </CardContent>
        </Card>
        
        <Button onClick={onNext} className="w-full" size="lg">
            Confirm and Deposit to Decision Bank <ArrowRight className="ml-2" />
        </Button>
    </div>
  );
}

function Screen8_DecisionBank({ onReset }: { onReset: () => void }) {
    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Strategic Dashboard & Decision Bank</h1>
                    <p className="text-muted-foreground">Tracking the impact of decisions on strategic objectives.</p>
                </div>
                 <Button onClick={onReset} variant="outline">Start New Decision Flow</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Landmark className="mr-2" />Decision Bank</CardTitle>
                        <CardDescription>A searchable, auditable repository of all organizational decisions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="border rounded-lg">
                            <div className="p-4 bg-muted/30 flex justify-between items-center">
                               <div>
                                    <p className="font-semibold">Approved: Business Case for Public Feedback Software</p>
                                    <p className="text-xs text-muted-foreground">Decided: 15 Oct 2024 | Cycle Time: 12 Days | Alignment: 85%</p>
                               </div>
                               <Button variant="ghost" size="sm">View Record</Button>
                            </div>
                             <div className="p-4 flex justify-between items-center border-t">
                               <div>
                                    <p className="font-semibold">Endorsed: Q3 Marketing Strategy</p>
                                    <p className="text-xs text-muted-foreground">Decided: 02 Oct 2024 | Cycle Time: 8 Days | Alignment: 92%</p>
                               </div>
                               <Button variant="ghost" size="sm">View Record</Button>
                            </div>
                             <div className="p-4 flex justify-between items-center border-t">
                               <div>
                                    <p className="font-semibold">Noted: IT Infrastructure Update</p>
                                    <p className="text-xs text-muted-foreground">Decided: 28 Sep 2024 | Cycle Time: 3 Days | Alignment: 65%</p>
                               </div>
                               <Button variant="ghost" size="sm">View Record</Button>
                            </div>
                       </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><BarChart className="mr-2" />Impact Tracking</CardTitle>
                         <CardDescription>Connecting decisions to strategic progress.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold text-sm">Objective: Improve Citizen Service Score by 15%</p>
                            <div className="w-full bg-muted rounded-full h-4 mt-1">
                                <div className="bg-green-500 h-4 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                             <p className="text-xs text-muted-foreground mt-1">Progress: 11% / 15% (On Track)</p>
                        </div>
                        <Separator/>
                         <div>
                            <p className="font-semibold text-sm">Next Critical Decision Point</p>
                             <p className="text-muted-foreground text-xs">Project "CivicEngage" vendor review in <span className="font-bold text-foreground">90 Days</span>.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function PrototypePage() {
  const [screen, setScreen] = useState(1);

  const handleNext = () => setScreen(prev => prev + 1);
  const handleReset = () => setScreen(1);

  const renderScreen = () => {
    switch (screen) {
      case 1:
        return <Screen1_AgentIntake onNext={handleNext} />;
      case 2:
        return <Screen2_ClarifyingQuestions onNext={handleNext} />;
      case 3:
        return <Screen3_DraftGeneration onNext={handleNext} />;
      case 4:
        return <Screen4_Consultation onNext={handleNext} />;
      case 5:
        return <Screen5_GovernanceHandoff onNext={handleNext} />;
      case 6:
        return <Screen6_DecisionHub onNext={handleNext} />;
      case 7:
        return <Screen7_DecisionCapture onNext={handleNext} />;
      case 8:
        return <Screen8_DecisionBank onReset={handleReset} />;
      default:
        return <Screen1_AgentIntake onNext={handleNext} />;
    }
  };

  return (
    <>
        {renderScreen()}
    </>
  );
}

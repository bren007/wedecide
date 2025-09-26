
'use client';

import { useEffect, useState, useTransition } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import type { DecisionBriefV2 } from '@/lib/types';
import { AppLayout } from '@/components/app-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StrategicAlignment } from '@/components/strategic-alignment';
import { getBrief, refineDraft } from '@/app/brief/actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingBriefPage from './loading';
import { Briefcase, FileText, Wand2, Group } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';


// Stage 2: Component to display and refine the generated draft
function DraftView({ brief }: { brief: DecisionBriefV2 }) {
    const { user } = useAuth();
    const latestVersion = brief.versions.at(-1)!;
    const { brief: briefContent, fullArtifact } = latestVersion;
    const [refinementInstruction, setRefinementInstruction] = useState('');
    const [isRefining, startRefinementTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();

    const handleRefine = () => {
        if (!refinementInstruction.trim() || !user) return;

        startRefinementTransition(async () => {
            try {
                await refineDraft(brief.id, refinementInstruction);
                toast({
                    title: 'Draft Refined',
                    description: 'The agent has created a new version of your brief.',
                });
                setRefinementInstruction('');
                router.refresh();
            } catch (error: any) {
                toast({
                    title: 'Error Refining Draft',
                    description: error.message,
                    variant: 'destructive',
                });
            }
        });
    };

    if (!briefContent || !fullArtifact) {
      return (
        <div className="text-center text-muted-foreground">
          <p>The agent is generating the draft...</p>
          <p>This page will refresh automatically when it's ready.</p>
        </div>
      )
    };

    return (
        <>
            <div className="space-y-6 lg:col-span-2">
                <Tabs defaultValue="brief" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="brief">Decision Brief</TabsTrigger>
                        <TabsTrigger value="artifact">Full Artifact</TabsTrigger>
                    </TabsList>
                    <TabsContent value="brief">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Briefcase /> Decision Brief</CardTitle>
                                <CardDescription>A concise summary of the full artifact, suitable for executive review.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-1">Title</h4>
                                    <p className="text-sm text-muted-foreground">{briefContent.title}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">Strategic Case</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{briefContent.strategicCase}</p>
                                </div>
                                 <div>
                                    <h4 className="font-semibold mb-1">Recommendation</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{briefContent.recommendation}</p>
                                 </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="artifact">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FileText /> Full Artifact</CardTitle>
                                <CardDescription>The comprehensive, detailed decision document.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-1">Title</h4>
                                    <p className="text-sm text-muted-foreground">{fullArtifact.title}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">Strategic Case</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{fullArtifact.strategicCase}</p>
                                 </div>
                                 <div>
                                    <h4 className="font-semibold mb-1">Options Analysis</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{fullArtifact.optionsAnalysis}</p>
                                 </div>
                                 <div>
                                    <h4 className="font-semibold mb-1">Financial Case</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{fullArtifact.financialCase}</p>
                                 </div>
                                 <div>
                                    <h4 className="font-semibold mb-1">Recommendation</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{fullArtifact.recommendation}</p>
                                 </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            <div className="space-y-6 lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Strategic Alignment</CardTitle>
                        <CardDescription>{briefContent.alignmentRationale}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <StrategicAlignment score={briefContent.alignmentScore} />
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Next Steps</CardTitle>
                        <CardDescription>Refine the draft with further instructions or move it to the next stage.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label htmlFor="refinement-instruction">Refinement Instruction</Label>
                             <Textarea 
                                id="refinement-instruction"
                                placeholder="e.g., 'Expand on the financial model' or 'Add more detail to the risk section...'"
                                value={refinementInstruction}
                                onChange={(e) => setRefinementInstruction(e.target.value)}
                             />
                        </div>
                        <Button onClick={handleRefine} disabled={isRefining || !refinementInstruction.trim() || !user}>
                            {isRefining ? 'Agent is refining...' : <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Refine Draft
                            </>}
                        </Button>
                        <Button variant="outline" className="w-full" disabled>
                            <Group className="mr-2 h-4 w-4" />
                           Ready for Deliberation
                        </Button>
                    </CardContent>
                 </Card>
            </div>
        </>
    )
}

export default function BriefPage() {
  const [brief, setBrief] = useState<DecisionBriefV2 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const briefId = params.id as string;
    if (!briefId || !user) return;
    
    let isCancelled = false;

    const fetchBrief = async () => {
      setIsLoading(true);
      try {
        const fetchedBrief = await getBrief(briefId);
        if (!isCancelled) {
          setBrief(fetchedBrief);
        }
      } catch (error) {
        console.error("Failed to fetch brief", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    fetchBrief();

    // Set up a poller to refresh data every 5 seconds until draft is ready
    const interval = setInterval(() => {
      // Don't poll if we already have a draft
      if (brief && brief.versions.length > 0 && brief.versions.at(-1)?.brief) {
        clearInterval(interval);
        return;
      }
       router.refresh();
    }, 5000);
    
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };

  }, [params.id, router, brief, user]);

  if (isLoading) {
    return <LoadingBriefPage />;
  }

  if (!brief) {
    return notFound();
  }

  const { status, goal } = brief;
  const latestVersion = brief.versions.at(-1);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
                {status === 'Discovery' ? 'New Brief' : (latestVersion?.brief?.title || 'Brief')}
            </h1>
            <p className="text-muted-foreground max-w-2xl">{goal}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {status === 'Discovery' && (
             <div className="lg:col-span-3 text-center text-muted-foreground p-8">
              <p>The agent is creating your draft based on your answers.</p>
              <p>This page will automatically update when it's ready.</p>
            </div>
          )}
          {status === 'Draft' && <DraftView brief={brief} />}
        </div>
      </div>
    </AppLayout>
  );
}

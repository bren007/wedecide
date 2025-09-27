
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
import { Briefcase, FileText, Wand2, Group, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Component to display and refine the generated draft
function DraftView({ brief, onRefine }: { brief: DecisionBriefV2, onRefine: () => void }) {
    const latestVersion = brief.versions.at(-1);
    const { brief: briefContent, fullArtifact } = latestVersion || {};
    const [refinementInstruction, setRefinementInstruction] = useState('');
    const [isRefining, startRefinementTransition] = useTransition();
    const { toast } = useToast();

    const handleRefine = () => {
        if (!refinementInstruction.trim()) return;

        startRefinementTransition(async () => {
            try {
                await refineDraft(brief.id, refinementInstruction);
                toast({
                    title: 'Draft Refined',
                    description: 'The agent has created a new version of your brief.',
                });
                setRefinementInstruction('');
                onRefine();
            } catch (error: any) {
                toast({
                    title: 'Error Refining Draft',
                    description: error.message,
                    variant: 'destructive',
                });
            }
        });
    };
    
    if (brief.status === 'Discovery' || !latestVersion) {
      return (
        <div className="lg:col-span-3 text-center text-muted-foreground p-8 space-y-4">
            <p>The agent is creating your draft based on your answers.</p>
            <p>This page will automatically update when it's ready.</p>
             <Button onClick={onRefine} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Status
            </Button>
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
                                {briefContent ? <>
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
                                </>: <p className="text-sm text-muted-foreground">Brief content is being generated...</p>}
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
                                {fullArtifact ? <>
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
                                </> : <p className="text-sm text-muted-foreground">Full artifact content is being generated...</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            <div className="space-y-6 lg:col-span-1">
                 {briefContent && <Card>
                    <CardHeader>
                        <CardTitle>Strategic Alignment</CardTitle>
                        <CardDescription>{briefContent.alignmentRationale}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <StrategicAlignment score={briefContent.alignmentScore} />
                    </CardContent>
                 </Card>}
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
                        <Button onClick={handleRefine} disabled={isRefining || !refinementInstruction.trim()}>
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
  
  const briefId = params.id as string;
  
  const handleDataRefresh = () => {
    // This function tells the Next.js router to re-fetch the data for the current page
    // and re-render the server components, which in turn re-fetches the brief data.
    router.refresh();
  };

  useEffect(() => {
    let isCancelled = false;
    
    const fetchBriefData = async () => {
      if (isCancelled) return;
      setIsLoading(true);
      try {
        const fetchedBrief = await getBrief(briefId);
        if (!isCancelled) {
          setBrief(fetchedBrief);
        }
      } catch (error) {
        console.error("Failed to fetch brief", error);
        if (!isCancelled) {
          setBrief(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    
    if (briefId) {
      fetchBriefData();
    }

    return () => {
      isCancelled = true;
    };
  }, [briefId, router]);


  // This effect will run whenever the brief data changes.
  // If the brief is still being discovered, it sets up a poller.
  useEffect(() => {
    let poller: NodeJS.Timeout | null = null;
    if (brief?.status === 'Discovery') {
      poller = setInterval(() => {
        console.log('Polling for updated brief status...');
        router.refresh();
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (poller) {
        clearInterval(poller);
      }
    }
  }, [brief?.status, router]);


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
                {status === 'Discovery' || !latestVersion?.brief?.title
                  ? 'New Brief' 
                  : latestVersion.brief.title
                }
            </h1>
            <p className="text-muted-foreground max-w-2xl">{goal}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <DraftView brief={brief} onRefine={handleDataRefresh} />
        </div>
      </div>
    </AppLayout>
  );
}

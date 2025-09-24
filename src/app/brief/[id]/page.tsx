'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DecisionBriefV2, AgentQuestion } from '@/lib/types';
import { AppLayout } from '@/components/app-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StrategicAlignment } from '@/components/strategic-alignment';
import { getBrief, generateDraft } from '@/app/brief/actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingBriefPage from './loading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, FileText, Briefcase, Bot } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

type FormValues = {
  responses: Record<string, string>;
};

// Stage 1: Component to answer the agent's initial questions
function DiscoveryForm({ brief }: { brief: DecisionBriefV2 }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const latestVersion = brief.versions.at(-1);
  const agentQuestions = latestVersion?.agentQuestions || [];
  const identifiedSources = latestVersion?.identifiedSources || [];

  const validationSchema = useMemo(() => {
    const shape = agentQuestions.reduce((acc, _q, index) => {
      acc[index] = z.string().min(1, 'An answer is required.');
      return acc;
    }, {} as Record<string, z.ZodString>);
    return z.object({ responses: z.object(shape) });
  }, [agentQuestions]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
  });

  const onSubmit = (data: FormValues) => {
    const userResponses = agentQuestions.reduce((acc, q, index) => {
      acc[q.question] = data.responses[index];
      return acc;
    }, {} as Record<string, string>);

    startTransition(async () => {
      try {
        await generateDraft(brief.id, userResponses);
        toast({
          title: 'Draft Generated',
          description: 'The agent has created the first draft of your brief.',
        });
        router.refresh();
      } catch (error: any) {
        toast({
          title: 'Error Generating Draft',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="space-y-6 lg:col-span-1">
      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>Agent Discovery</AlertTitle>
        <AlertDescription>
          The agent has identified the following potential data sources and has some questions to clarify your goal.
        </AlertDescription>
      </Alert>
       <Card>
        <CardHeader>
          <CardTitle>Identified Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {identifiedSources.map((source, i) => <li key={i}>{source}</li>)}
          </ul>
        </CardContent>
      </Card>
      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800">
        <CardHeader>
          <CardTitle>Questions for Clarification</CardTitle>
          <CardDescription>Answer the questions below to generate the draft document.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              {agentQuestions.map((q, i) => (
                <FormField
                  key={i}
                  control={methods.control}
                  name={`responses.${i}`}
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor={field.name} className="font-semibold text-sm">{q.question}</Label>
                      <Alert className="mt-2 text-sm bg-amber-100/50 dark:bg-amber-900/50">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Rationale:</strong> {q.rationale}
                        </AlertDescription>
                      </Alert>
                      <FormControl>
                        <Textarea id={field.name} placeholder="Your answer..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button type="submit" disabled={isPending || !methods.formState.isValid}>
                {isPending ? 'Agent is thinking...' : 'Generate Draft'}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}

// Stage 2: Component to display and refine the generated draft
function DraftView({ brief }: { brief: DecisionBriefV2 }) {
    const latestVersion = brief.versions.at(-1)!;
    const { brief: briefContent, fullArtifact } = latestVersion;

    if (!briefContent || !fullArtifact) return null;

    return (
        <>
            <div className="space-y-6 lg:col-span-2">
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
            </div>
        </>
    )
}

export default function BriefPage() {
  const [brief, setBrief] = useState<DecisionBriefV2 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    const briefId = params.id as string;
    if (!briefId) return;
    
    const fetchBrief = async () => {
      setIsLoading(true);
      try {
        const fetchedBrief = await getBrief(briefId);
        setBrief(fetchedBrief);
      } catch (error) {
        console.error("Failed to fetch brief", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrief();
  }, [params.id]);

  if (isLoading) {
    return <LoadingBriefPage />;
  }

  if (!brief) {
    return notFound();
  }

  const { status, goal } = brief;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
                {status === 'Discovery' ? 'New Brief' : (brief.versions.at(-1)?.brief?.title || 'Brief')}
            </h1>
            <p className="text-muted-foreground max-w-2xl">{goal}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {status === 'Discovery' && <DiscoveryForm brief={brief} />}
          {status === 'Draft' && <DraftView brief={brief} />}
        </div>
      </div>
    </AppLayout>
  );
}

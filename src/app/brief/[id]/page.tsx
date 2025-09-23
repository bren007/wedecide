
'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DecisionBrief, AgentQuestion } from '@/lib/types';
import { AppLayout } from '@/components/app-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StrategicAlignment } from '@/components/strategic-alignment';
import { getBrief, addBriefVersion } from '@/app/brief/actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingBriefPage from './loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

type FormValues = {
  [key: string]: string;
};

function RefineForm({ brief }: { brief: DecisionBrief }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const latestVersion = brief.versions.at(-1);
  const agentQuestions = latestVersion?.agentQuestions || [];

  const validationSchema = useMemo(() => {
    if (!agentQuestions || agentQuestions.length === 0) {
      return z.object({});
    }
    const schemaShape = agentQuestions.reduce((acc, q) => {
      acc[q.question] = z.string({required_error: "This field is required."}).min(1, 'This field is required.');
      return acc;
    }, {} as Record<string, z.ZodString>);
    return z.object(schemaShape);
  }, [agentQuestions]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: FormValues) => {
    startTransition(async () => {
      try {
        await addBriefVersion(brief.id, data);
        toast({
          title: 'Brief Refined',
          description: 'The agent has updated the brief with your answers.',
        });
        router.refresh();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: `Failed to refine the brief: ${error.message}`,
          variant: 'destructive',
        });
      }
    });
  };

  if (!agentQuestions || agentQuestions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800">
      <CardHeader>
        <CardTitle>Refine the Brief</CardTitle>
        <CardDescription>Answer the agent's questions to generate a more detailed version.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {agentQuestions.map((q, i) => (
              <FormField
                key={i}
                control={methods.control}
                name={q.question}
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor={field.name} className="font-semibold text-sm">{q.question}</Label>
                    <Alert className="mt-2 text-sm">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Rationale:</strong> {q.rationale}
                      </AlertDescription>
                    </Alert>
                    <FormControl>
                      <Textarea
                        id={field.name}
                        placeholder="Your answer..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" disabled={isPending || !methods.formState.isValid}>
              {isPending ? 'Agent is thinking...' : 'Refine Brief'}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

export default function BriefPage() {
  const [brief, setBrief] = useState<DecisionBrief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const briefId = params.id as string;

  useEffect(() => {
    if (!briefId) return;
    const fetchBrief = async () => {
      setIsLoading(true);
      const fetchedBrief = await getBrief(briefId);
      if (fetchedBrief) {
        setBrief(fetchedBrief);
      }
      setIsLoading(false);
    };
    fetchBrief();
  }, [briefId]);

  if (isLoading) {
    return <LoadingBriefPage />;
  }

  if (!brief) {
    return notFound();
  }

  const latestVersion = brief.versions.at(-1)!;
  const { content } = latestVersion;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
            <p className="text-muted-foreground">{brief.id}</p>
          </div>
          <StrategicAlignment score={content.alignmentScore} />
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Strategic Case</CardTitle>
                <CardDescription>Why this decision is important and how it aligns with our goals.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{content.strategicCase}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Options Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{content.optionsAnalysis}</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Financial Case</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{content.financialCase}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{content.recommendation}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-1">
             <RefineForm brief={brief} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { DecisionBrief } from '@/lib/types';
import { AppLayout } from '@/components/app-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StrategicAlignment } from '@/components/strategic-alignment';
import { getBrief, addBriefVersion } from '@/app/brief/actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingBriefPage from './loading';

type FormValues = {
  [key: string]: string;
};

export default function BriefPage({ params }: { params: { id: string } }) {
  const [brief, setBrief] = useState<DecisionBrief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { isValid } } = useForm<FormValues>();

  useEffect(() => {
    const fetchBrief = async () => {
      setIsLoading(true);
      const fetchedBrief = await getBrief(params.id);
      if (fetchedBrief) {
        setBrief(fetchedBrief);
      }
      setIsLoading(false);
    };
    fetchBrief();
  }, [params.id]);

  const onSubmit = async (data: FormValues) => {
    if (!brief) return;
    setIsSubmitting(true);
    try {
      await addBriefVersion(brief.id, data);
      toast({
        title: 'Brief Refined',
        description: 'The agent has updated the brief with your answers.',
      });
      // Refetch the data by refreshing the page
      router.refresh();
       const fetchedBrief = await getBrief(params.id);
       if (fetchedBrief) {
         setBrief(fetchedBrief);
       }
    } catch (error: any) {
      console.error('Failed to refine brief', error);
      toast({
        title: 'Error',
        description: `Failed to refine the brief: ${error.message}`,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };
  
  if (isLoading) {
    return <LoadingBriefPage />;
  }

  if (!brief) {
    return notFound();
  }

  const latestVersion = brief.versions.at(-1)!;
  const { content, agentQuestions } = latestVersion;
  const hasQuestions = agentQuestions && agentQuestions.length > 0;

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
             {hasQuestions && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardHeader>
                        <CardTitle>Refine the Brief</CardTitle>
                        <CardDescription>Answer the agent's questions to generate a more detailed version.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {agentQuestions.map((q, i) => (
                                <div key={i} className="space-y-2">
                                    <Label htmlFor={`question-${i}`} className="font-semibold text-sm">{q}</Label>
                                    <Textarea
                                        id={`question-${i}`}
                                        {...register(q, { required: true })}
                                        placeholder="Your answer..."
                                        rows={3}
                                    />
                                </div>
                            ))}
                            <Button type="submit" disabled={isSubmitting || !isValid}>
                                {isSubmitting ? 'Agent is thinking...' : 'Refine Brief'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
             )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

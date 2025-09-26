'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AppLayout } from '@/components/app-sidebar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { startBriefingProcess } from '@/app/brief/actions';
import { clarifyGoal } from './actions';
import {
  type ClarifyGoalOutput,
  type ClarificationQuestion,
} from '@/lib/schema/clarify-goal-schema';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/components/auth-provider';

type FormValues = {
  responses: Record<string, string>;
};

export default function GoalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<'enterGoal' | 'clarifyGoal'>('enterGoal');
  const [goal, setGoal] = useState('');
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [isClarifying, startClarifyTransition] = useTransition();
  const [isGenerating, startGeneratingTransition] = useTransition();

  const validationSchema = z.object({
    responses: z.object(
      questions.reduce(
        (acc, q) => {
          acc[q.category] = z.string().min(1, 'An answer is required.');
          return acc;
        },
        {} as Record<string, z.ZodString>
      )
    ),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
  });

  const handleGoalSubmit = () => {
    if (!goal.trim() || !user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to start a new brief.',
        variant: 'destructive',
      });
      return;
    }

    startClarifyTransition(async () => {
      try {
        const result = await clarifyGoal(goal);
        setQuestions(result.questions);
        form.reset({
          responses: result.questions.reduce(
            (acc, q) => {
              acc[q.category] = '';
              return acc;
            },
            {} as Record<string, string>
          ),
        });
        setStep('clarifyGoal');
      } catch (error: any) {
        toast({
          title: 'Error Clarifying Goal',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleClarificationSubmit = (data: FormValues) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to generate a brief.',
        variant: 'destructive',
      });
      return;
    }
    startGeneratingTransition(async () => {
      try {
        const newBriefId = await startBriefingProcess(goal, data.responses);
        toast({
          title: 'Brief Generation Started',
          description: 'The agent is now creating your draft.',
        });
        router.push(`/brief/${newBriefId}`);
      } catch (error: any) {
        toast({
          title: 'Error Generating Brief',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col items-center justify-center">
        <div className="w-full max-w-3xl">
          {step === 'enterGoal' && (
            <Card>
              <CardHeader>
                <CardTitle>What is your goal?</CardTitle>
                <CardDescription>
                  Describe the outcome you want to achieve or the problem you
                  are trying to solve. The more detail, the better.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., 'Draft a business case for a new public-facing portal that improves citizen access to services...'"
                  rows={5}
                  className="text-lg"
                />
                <Button
                  onClick={handleGoalSubmit}
                  disabled={isClarifying || !goal.trim() || !user}
                  size="lg"
                >
                  {isClarifying ? 'Agent is thinking...' : 'Start Brief'}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'clarifyGoal' && (
            <Card>
              <CardHeader>
                <CardTitle>Let's Refine Your Goal</CardTitle>
                <CardDescription>
                  To create the best possible draft, I have a few clarifying
                  questions. Your answers will help me tailor the brief to your
                  specific needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleClarificationSubmit)}
                    className="space-y-6"
                  >
                    {questions.map((q, i) => (
                      <FormField
                        key={i}
                        control={form.control}
                        name={`responses.${q.category}`}
                        render={({ field }) => (
                          <FormItem>
                            <Label className="font-semibold text-sm">
                              {q.question}
                            </Label>
                            <FormControl>
                              <Textarea
                                placeholder="Your answer..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    <Button
                      type="submit"
                      disabled={isGenerating || !form.formState.isValid}
                      size="lg"
                    >
                      {isGenerating
                        ? 'Agent is generating...'
                        : 'Generate Brief'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

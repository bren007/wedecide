
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
import type { ClarificationQuestion } from '@/lib/types';
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

const SAMPLE_GOAL = "Draft a business case using the better business case format. The business case should seek funding to construct a new call centre system for the department's customer helpdesk. The call centre system must be up and running before Q3 2028 and cost no more than $5m to implement. The system should provide 10% efficiency gains and support a 15% increase in customer satisfaction.";
const SAMPLE_RESPONSES: Record<string, string> = {
    'Strategic Alignment': 'This primarily supports our "Improve Public Service Delivery" objective by enhancing efficiency and satisfaction.',
    'Scope and Constraints': 'The brief should focus on the business case for funding approval, including high-level timelines and resource needs, but defer detailed implementation planning.',
    'Data and Information Gaps': 'Please incorporate the attached "2024 Customer Satisfaction Report" and the "Current Call Centre Operating Costs" spreadsheet.',
    'Audience and Purpose': 'The ultimate decision-maker is the "Strategic Investment Board", and the purpose is to secure the $5m funding allocation for the project.'
};


export default function GoalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<'enterGoal' | 'clarifyGoal'>('enterGoal');
  const [goal, setGoal] = useState(SAMPLE_GOAL);
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
        title: 'Goal Required',
        description: 'Please enter a goal to start the process.',
        variant: 'destructive',
      });
      return;
    }

    startClarifyTransition(async () => {
      try {
        const result = await clarifyGoal({ userGoal: goal });
        setQuestions(result.questions);
        
        const initialResponses = result.questions.reduce((acc, q) => {
            acc[q.category] = SAMPLE_RESPONSES[q.category] || '';
            return acc;
        }, {} as Record<string, string>);

        form.reset({ responses: initialResponses });
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
    startGeneratingTransition(async () => {
      try {
        const newBriefId = await startBriefingProcess(goal, data.responses);
        toast({
          title: 'Brief Generation Started',
          description: "The agent is now creating your draft. You'll be redirected shortly.",
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
                  are trying to solve. The more detail, the better. (This is pre-filled for speed).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., 'Draft a business case for a new public-facing portal that improves citizen access to services...'"
                  rows={8}
                  className="text-base"
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
                  To create the best possible draft, the agent has a few clarifying
                  questions. Your answers will help tailor the brief to your
                  specific needs. (These are pre-filled for speed).
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
                                rows={3}
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

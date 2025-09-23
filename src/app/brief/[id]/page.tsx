import { initializeAdmin } from '@/lib/firebase/server-admin';
import type { DecisionBrief } from '@/lib/types';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/app-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StrategicAlignment } from '@/components/strategic-alignment';

async function getBrief(id: string): Promise<DecisionBrief | null> {
  try {
    const { db } = initializeAdmin();
    const briefDoc = await db.collection('decisionBriefs').doc(id).get();

    if (!briefDoc.exists) {
      return null;
    }
    // Note: We're not doing RBAC/tenancy checks here yet, but will in middleware
    return briefDoc.data() as DecisionBrief;
  } catch (error) {
    console.error(`Failed to fetch brief ${id}`, error);
    return null;
  }
}

export default async function BriefPage({ params }: { params: { id: string } }) {
  const brief = await getBrief(params.id);

  if (!brief) {
    notFound();
  }

  const latestVersion = brief.versions.at(-1)!;
  const { content, agentQuestions } = latestVersion;

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
            <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                    <CardTitle>Agent's Questions for Clarification</CardTitle>
                    <CardDescription>Answer these questions to help the agent refine the brief.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {agentQuestions?.map((q, i) => (
                        <div key={i}>
                            <p className="font-semibold text-sm">{q}</p>
                            {/* We will add input fields here later */}
                        </div>
                    ))}
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

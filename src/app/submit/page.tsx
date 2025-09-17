
import { DecisionForm } from '@/components/decision-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getObjectives } from '@/lib/data';
import { Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntelligentIngestion } from '@/components/intelligent-ingestion';
import { GenerativeScaffolding } from '@/components/generative-scaffolding';
import { FileUp, PencilRuler } from 'lucide-react';


export default async function SubmitPage() {
  const objectives = await getObjectives();
  return (
    <>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
           <div className="flex items-center gap-4">
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Decision Preparation</h1>
            </div>
            
            <Card>
                <CardHeader>
                <CardTitle>AI Decision Assistant</CardTitle>
                <CardDescription>
                    Accelerate your proposal preparation. Use the AI to generate a first draft from a prompt, or upload and analyze an existing document for feedback and content improvements.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Tabs defaultValue="scaffold">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="scaffold">
                            <PencilRuler className="mr-2 h-4 w-4" />
                            AI Draft
                        </TabsTrigger>
                        <TabsTrigger value="ingest">
                            <FileUp className="mr-2 h-4 w-4" />
                            Upload & Analyze
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="scaffold">
                        <GenerativeScaffolding />
                    </TabsContent>
                    <TabsContent value="ingest">
                        <IntelligentIngestion />
                    </TabsContent>
                </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>New Proposal Form</CardTitle>
                    <CardDescription>
                        Fill out the fields below for formal submission to the secretariat. Use the AI assistant above to help generate content.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DecisionForm objectives={objectives} />
                </CardContent>
            </Card>
        </div>
      </SidebarInset>
    </>
  );
}

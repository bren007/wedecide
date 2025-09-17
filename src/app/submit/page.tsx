
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
        <div className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 gap-6 md:gap-8">
           <div className="flex items-center gap-4">
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Decision Preparation</h1>
            </div>
            
            <Tabs defaultValue="manual" className="w-full max-w-4xl mx-auto">
              <Card>
                 <CardHeader>
                    <CardTitle>Submit a New Proposal</CardTitle>
                    <CardDescription>
                      Start by drafting a new proposal with AI assistance, or by uploading an existing document for analysis. Once complete, fill out the form below for formal submission.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
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
                 </CardContent>
              </Card>

              <div className="mt-8">
                <DecisionForm objectives={objectives} />
              </div>

            </Tabs>
        </div>
      </SidebarInset>
    </>
  );
}

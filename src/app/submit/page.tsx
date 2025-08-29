
import { DecisionForm } from '@/components/decision-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getObjectives } from '@/lib/data';
import { Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

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
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle>Submit a New Proposal</CardTitle>
              <CardDescription>
                Complete the decision form below. Once submitted, the secretariat will review the proposal before it can be scheduled for a meeting.
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

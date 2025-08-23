
import { DecisionForm } from '@/components/decision-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getObjectives } from '@/lib/data';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default async function SubmitPage() {
  const objectives = await getObjectives();
  return (
    <>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-1 items-start justify-center p-4 md:p-6 lg:p-8">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle>Decision Preparation</CardTitle>
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

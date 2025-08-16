
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
        <div className="flex flex-1 items-center justify-center p-4 md:p-6 lg:p-8">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Submit a New Decision</CardTitle>
              <CardDescription>
                Fill out the form below to submit a proposal for review by the secretariat.
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

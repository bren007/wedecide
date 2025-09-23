
import { AppLayout } from "@/components/app-sidebar";

export default function AdminPage() {
    return (
        <AppLayout>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and settings for your organization.</p>
        </AppLayout>
    )
}

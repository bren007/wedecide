
'use client';

import { AppLayout } from '@/components/app-sidebar';

export default function PrototypeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppLayout>
            <div className="container mx-auto py-8 md:py-12">
                {children}
            </div>
        </AppLayout>
    );
}

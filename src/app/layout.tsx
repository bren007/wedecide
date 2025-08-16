
'use client';

import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { LayoutProps } from 'next/dist/lib/metadata/types/extra-types';

export default function RootLayout({
  children,
}: {
  children: (props: { meetingMode: boolean; setMeetingMode: (mode: boolean) => void; }) => React.ReactNode;
}) {
  const [meetingMode, setMeetingMode] = useState(false);

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full">
        <SidebarProvider>
          <div className={cn(meetingMode && 'hidden')}>
            <Sidebar>
              <AppSidebar />
            </Sidebar>
          </div>
          <SidebarInset>
            {/* By passing a function as a children, we can pass the state to the meeting page */}
            {typeof children === 'function' ? children({ meetingMode, setMeetingMode }) : children}
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}

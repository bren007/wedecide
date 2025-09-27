
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Target, Users, Landmark, LogOut, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-primary-foreground"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold tracking-tighter text-primary">WeDecide</h2>
    </div>
  );
}

function NavLinks() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const isActive = (path: string) => pathname === path;

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <SidebarMenu>
        <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/')}>
          <Link href="/" onClick={handleLinkClick}>
            <Home />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function UserProfile() {
    return (
        <div className="mt-auto p-2">
            <Separator className="mb-2" />
            <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={'https://picsum.photos/seed/100/40/40'} alt={'Demo User'} />
                    <AvatarFallback>DU</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">Demo User</p>
                    <p className="text-xs text-muted-foreground truncate">director@gov.org</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

export function AppLayout({ children }: { children: React.ReactNode}) {
  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                <Logo />
            </SidebarHeader>
            <Separator />
            <SidebarContent>
                <NavLinks />
            </SidebarContent>
            <UserProfile />
        </Sidebar>
        <SidebarInset>
            <header className="p-4 md:hidden">
                <SidebarTrigger />
            </header>
            <main className="flex-1">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  )
}

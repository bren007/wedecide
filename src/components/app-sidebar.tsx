
'use client';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LayoutDashboard, FilePlus2, ClipboardList, Landmark } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
        <SidebarMenuButton asChild isActive={isActive('/submit')}>
          <Link href="/submit" onClick={handleLinkClick}>
            <FilePlus2 />
            <span>Decision Preparation</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/')}>
          <Link href="/" onClick={handleLinkClick}>
            <LayoutDashboard />
            <span>Secretariat Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/meeting')}>
          <Link href="/meeting" onClick={handleLinkClick}>
            <ClipboardList />
            <span>Decision Making</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/past-decisions')}>
          <Link href="/past-decisions" onClick={handleLinkClick}>
            <Landmark />
            <span>Decision Bank</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}


export function AppSidebar() {
  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <NavLinks />
      </SidebarContent>
    </>
  );
}

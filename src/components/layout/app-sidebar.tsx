'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FolderKanban, Users, LayoutDashboard, UsersRound, GanttChart, Home, Megaphone } from 'lucide-react'
import { useUser } from '@/lib/hooks/use-user'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AppSidebar() {
  const pathname = usePathname()
  const { user, isAdmin, isSuperAdmin } = useUser()

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className="border-b px-3 py-3 overflow-hidden">
        <Link href="/home">
          <Image src="/logo.png" alt="Studio Dorian" width={140} height={140} className="w-full max-w-[140px]" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ניווט</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/home'}>
                  <Link href="/home">
                    <Home className="size-4" />
                    <span>בית</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/projects' || pathname.startsWith('/projects/')}>
                  <Link href="/projects">
                    <FolderKanban className="size-4" />
                    <span>הפרויקטים שלי</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/now'}>
                  <Link href="/now">
                    <LayoutDashboard className="size-4" />
                    <span>לוח חי</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/timeline'}>
                  <Link href="/timeline">
                    <GanttChart className="size-4" />
                    <span>ציר זמן</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>ניהול</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/clients')}>
                    <Link href="/admin/clients">
                      <Users className="size-4" />
                      <span>לקוחות</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/announcements')}>
                    <Link href="/admin/announcements">
                      <Megaphone className="size-4" />
                      <span>הודעות</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isSuperAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/team')}>
                      <Link href="/admin/team">
                        <UsersRound className="size-4" />
                        <span>צוות</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-3 overflow-hidden">
        <div className="flex items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-sm leading-tight min-w-0">
            <span className="font-medium truncate">{user.full_name}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

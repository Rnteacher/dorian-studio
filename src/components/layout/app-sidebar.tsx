'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderKanban, Users, LayoutDashboard } from 'lucide-react'
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
  const { user, isAdmin } = useUser()

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3 overflow-hidden">
        <Link href="/projects" className="text-lg font-bold whitespace-nowrap">
          Dorian Studio
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ניווט</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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

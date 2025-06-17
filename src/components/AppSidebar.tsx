
import { useState } from 'react'
import { Calendar, Home, Users, Package, ChefHat, BarChart3, ClipboardList, TrendingUp, Activity, UserCheck, Settings, Cloud, Building2 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import SettingsDialog from "./SettingsDialog"
import { useAuth } from "@/contexts/AuthContext"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Ricette",
    url: "/recipes",
    icon: ChefHat,
  },
  {
    title: "Menu Engineering",
    url: "/menu-engineering",
    icon: BarChart3,
  },
  {
    title: "Gestione Inventario",
    url: "/inventory",
    icon: Package,
  },
  {
    title: "Food Cost",
    url: "/food-cost",
    icon: TrendingUp,
  },
  {
    title: "Pianificazione Produzione",
    url: "/production-planning",
    icon: ClipboardList,
  },
]

const customerItems = [
  {
    title: "Prenotazioni",
    url: "/reservations",
    icon: Calendar,
  },
  {
    title: "Analisi Clienti",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Previsioni Domanda",
    url: "/demand-forecast",
    icon: Activity,
  },
  {
    title: "Calendario Eventi",
    url: "/events",
    icon: Calendar,
  },
]

const staffItems = [
  {
    title: "Gestione Staff",
    url: "/staff",
    icon: UserCheck,
  },
]

const configItems = [
  {
    title: "Configura Ristorante",
    url: "/restaurant-config",
    icon: Building2,
  },
  {
    title: "CassaInCloud",
    url: "/cassa-in-cloud",
    icon: Cloud,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const [showSettings, setShowSettings] = useState(false)
  const { user, userProfile } = useAuth()

  const isActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(url)
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <ChefHat className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold">RestaurantOS</span>
              <span className="text-xs text-sidebar-muted-foreground">Management Suite</span>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Gestione Operativa</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Customer Experience</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {customerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Risorse Umane</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {staffItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Configurazione</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {configItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">
                  {user?.email?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-sm font-medium">{userProfile?.full_name || user?.email}</span>
                <span className="text-xs text-sidebar-muted-foreground">{userProfile?.role || 'User'}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Impostazioni</span>
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}

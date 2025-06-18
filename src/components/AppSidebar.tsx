import { Link, useLocation } from "react-router-dom";
import {
  ChefHat,
  Package,
  Brain,
  PieChart,
  TrendingUp,
  Users,
  Calendar,
  Utensils,
  Clock,
  Target,
  Settings,
  Building2,
  Zap,
  Home
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    category: "main"
  },
  {
    title: "Gestione Operativa",
    category: "operational",
    items: [
      {
        title: "Mapping Ricette",
        url: "/recipes",
        icon: ChefHat,
      },
      {
        title: "Inventario Ingredienti",
        url: "/inventory",
        icon: Package,
      },
      {
        title: "Planning Produzione",
        url: "/production-planning",
        icon: Calendar,
      },
    ]
  },
  {
    title: "Analisi & Performance",
    category: "analytics",
    items: [
      {
        title: "Menu Intelligence",
        url: "/food-cost",
        icon: Brain,
      },
      {
        title: "Analisi Clienti",
        url: "/customer-analysis",
        icon: Users,
      },
    ]
  },
  {
    title: "Previsioni & Eventi",
    category: "forecasting",
    items: [
      {
        title: "Previsione Domanda",
        url: "/demand-forecast",
        icon: TrendingUp,
      },
      {
        title: "Calendario Eventi",
        url: "/events",
        icon: Calendar,
      },
    ]
  },
  {
    title: "Staff & Servizio",
    category: "service",
    items: [
      {
        title: "Dashboard Staff",
        url: "/staff",
        icon: Utensils,
      },
      {
        title: "Gestione Turni",
        url: "/gestione-turni",
        icon: Clock,
      },
      {
        title: "Prenotazioni",
        url: "/reservations",
        icon: Target,
      },
    ]
  },
  {
    title: "Configurazione",
    category: "configuration",
    items: [
      {
        title: "Configurazione",
        url: "/configuration",
        icon: Settings,
      },
    ]
  },
  {
    title: "Integrazioni",
    category: "integrations",
    items: [
      {
        title: "CassaInCloud",
        url: "/cassa-in-cloud",
        icon: Zap,
      },
    ]
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { userProfile } = useAuth();

  const isActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <ChefHat className="h-6 w-6 text-orange-600" />
          <span className="font-bold text-lg">Bistro AI</span>
        </div>
        {userProfile?.restaurant && (
          <div className="px-2 py-1 text-xs text-sidebar-foreground/70">
            {userProfile.restaurant.name}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/")}>
                <Link to="/">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Grouped Navigation */}
        {navigationItems.slice(1).map((group) => (
          <SidebarGroup key={group.category}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items?.map((item) => (
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
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/profile")}>
              <Link to="/profile">
                <Settings />
                <span>Profilo & Impostazioni</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

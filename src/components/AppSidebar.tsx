import { LayoutDashboard, Activity, AlertTriangle, Microscope, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserRole } from "@/contexts/AuthContext";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { title: "Analysis", url: "/", icon: LayoutDashboard, roles: ["Worker", "Manager", "Admin"] },
  { title: "Sensors", url: "/sensors", icon: Activity, roles: ["Worker", "Manager", "Admin"] },
  { title: "Anomaly Alerts & Logs", url: "/alerts", icon: AlertTriangle, roles: ["Worker", "Manager", "Admin"] },
  { title: "Simulation", url: "/simulation", icon: Microscope, roles: ["Manager", "Admin"] },
  { title: "User Management", url: "/users", icon: Users, roles: ["Admin"] },
];

interface AppSidebarProps {
  userRole: UserRole;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  // Filter menu items based on user role
  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-6 text-primary">
            Microalgae Monitor
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-4 py-3.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="h-5 w-5" strokeWidth={2} />
                      <span className="text-base font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

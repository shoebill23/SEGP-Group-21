import { Building2, User, Shield, Briefcase, Wrench, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@/contexts/AuthContext";

interface AppHeaderProps {
  currentSite: string;
  onSiteChange: (site: string) => void;
  userName: string;
  userRole: UserRole;
  onLogout: () => void;
}

export function AppHeader({ 
  currentSite, 
  onSiteChange, 
  userName,
  userRole, 
  onLogout 
}: AppHeaderProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return <Shield className="h-4 w-4" />;
      case "Manager":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "Manager":
        return "bg-primary/20 text-primary border-primary/30";
      default:
        return "bg-accent/20 text-accent border-accent/30";
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <Select value={currentSite} onValueChange={onSiteChange}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Site A">Site A</SelectItem>
              <SelectItem value="Site B">Site B</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* User Info and Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`rounded-full px-3 gap-2 border ${getRoleStyle(userRole)} hover:opacity-80`}
            >
              {getRoleIcon(userRole)}
              <div className="flex flex-col items-start gap-0">
                <span className="text-xs font-medium leading-none">{userRole}</span>
                <span className="text-xs text-muted-foreground leading-none">{userName}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onLogout}
              className="text-destructive focus:text-destructive cursor-pointer gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

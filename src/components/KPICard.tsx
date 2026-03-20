import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  status: "normal" | "warning" | "critical";
  description?: string;
}

export function KPICard({ title, value, unit, icon: Icon, status, description }: KPICardProps) {
  const statusColors = {
    normal: "text-accent",
    warning: "text-chart-3",
    critical: "text-destructive",
  };

  const statusBg = {
    normal: "bg-accent/10",
    warning: "bg-chart-3/10",
    critical: "bg-destructive/10",
  };

  const statusBorder = {
    normal: "border-accent/20",
    warning: "border-chart-3/20",
    critical: "border-destructive/20",
  };

  return (
    <Card className={`border ${statusBorder[status]} bg-gradient-to-br from-card to-card/80 hover:from-card/90 hover:to-card/70 transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${statusBg[status]}`}>
            <Icon className={`h-4 w-4 ${statusColors[status]}`} />
          </div>
          <div className={`h-2 w-2 rounded-full ${status === "normal" ? "bg-accent" : status === "warning" ? "bg-chart-3" : "bg-destructive"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <div className="text-2xl font-bold text-foreground">
            {value}
            <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

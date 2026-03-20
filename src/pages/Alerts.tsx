import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, CheckCircle, Bot } from "lucide-react";

const siteData = {
  "Site A": {
    anomalyAlerts: [
      { id: 1, timestamp: "2024-01-15 14:32:15", type: "Light Intensity", severity: "warning", message: "Value above optimal range (850 μmol/m²s)" },
      { id: 2, timestamp: "2024-01-15 12:15:42", type: "Conductivity", severity: "info", message: "Conductivity at 1.85 mS/cm, stable nutrient levels" },
      { id: 3, timestamp: "2024-01-15 09:47:03", type: "Temperature", severity: "warning", message: "Spike detected: 25.8°C" },
      { id: 4, timestamp: "2024-01-15 08:22:11", type: "pH Level", severity: "resolved", message: "pH normalized to 7.2" },
      { id: 5, timestamp: "2024-01-15 06:35:28", type: "Turbidity", severity: "info", message: "Cell density increasing: 245 NTU" },
      { id: 6, timestamp: "2024-01-15 05:10:45", type: "Ultrasonic", severity: "info", message: "Tank level at 78%, within optimal range" },
    ],
    rlActions: [
      { id: 1, timestamp: "2024-01-15 14:30:00", action: "Reduce LED intensity", reason: "Light overexposure risk based on turbidity readings" },
      { id: 2, timestamp: "2024-01-15 12:00:00", action: "Adjust nutrient dosing", reason: "Conductivity trend suggests depletion" },
      { id: 3, timestamp: "2024-01-15 10:15:00", action: "Activate cooling system", reason: "Temperature optimization for growth phase" },
      { id: 4, timestamp: "2024-01-15 08:45:00", action: "Maintain current settings", reason: "All sensor parameters within optimal range" },
      { id: 5, timestamp: "2024-01-15 06:30:00", action: "Calibrate pH sensor", reason: "Scheduled daily maintenance" },
    ],
  },
  "Site B": {
    anomalyAlerts: [
      { id: 1, timestamp: "2024-01-15 15:18:22", type: "Temperature", severity: "warning", message: "Temperature exceeding 27°C threshold" },
      { id: 2, timestamp: "2024-01-15 13:42:15", type: "Conductivity", severity: "warning", message: "High conductivity at 2.12 mS/cm, check nutrient levels" },
      { id: 3, timestamp: "2024-01-15 11:30:00", type: "Ultrasonic", severity: "warning", message: "Tank level dropping: 65%" },
      { id: 4, timestamp: "2024-01-15 10:22:48", type: "pH Level", severity: "resolved", message: "pH level stabilized at 7.8 after adjustment" },
      { id: 5, timestamp: "2024-01-15 09:15:33", type: "Light Intensity", severity: "info", message: "Light intensity within optimal range (920 μmol/m²s)" },
      { id: 6, timestamp: "2024-01-15 07:05:12", type: "Turbidity", severity: "info", message: "Cell density healthy at 312 NTU" },
    ],
    rlActions: [
      { id: 1, timestamp: "2024-01-15 15:15:00", action: "Activate cooling system", reason: "Temperature trend exceeding safe threshold" },
      { id: 2, timestamp: "2024-01-15 13:30:00", action: "Initiate medium refill", reason: "Low tank level and high conductivity detected" },
      { id: 3, timestamp: "2024-01-15 11:00:00", action: "Reduce stirrer speed", reason: "Optimize oxygen transfer at current density" },
      { id: 4, timestamp: "2024-01-15 09:00:00", action: "Adjust pH dosing rate", reason: "pH drift correction required" },
      { id: 5, timestamp: "2024-01-15 07:00:00", action: "Run sensor diagnostics", reason: "Routine morning calibration check" },
    ],
  },
};

interface AlertsProps {
  currentSite: string;
}

const Alerts = ({ currentSite }: AlertsProps) => {
  const data = siteData[currentSite as keyof typeof siteData] || siteData["Site A"];
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-chart-3" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-accent" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      warning: "destructive" as const,
      info: "secondary" as const,
      resolved: "default" as const,
    };
    return <Badge variant={variants[severity as keyof typeof variants] || "secondary"}>{severity}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Anomaly Alerts & Logs</h1>
          <p className="text-muted-foreground">Anomaly detection and reinforcement learning actions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-chart-3 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">Monitoring Active</span>
        </div>
      </div>

      <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-chart-3" />
            Anomaly Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Sensor Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.anomalyAlerts.map((alert) => (
                <TableRow key={alert.id} className="hover:bg-secondary/30">
                  <TableCell>{getSeverityIcon(alert.severity)}</TableCell>
                  <TableCell className="font-mono text-sm">{alert.timestamp}</TableCell>
                  <TableCell className="font-medium">{alert.type}</TableCell>
                  <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            RL Model Actions
            <Badge variant="outline" className="ml-2 text-xs">Reinforcement Learning</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action Taken</TableHead>
                <TableHead>Reasoning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rlActions.map((action) => (
                <TableRow key={action.id} className="hover:bg-secondary/30">
                  <TableCell className="font-mono text-sm">{action.timestamp}</TableCell>
                  <TableCell className="font-semibold text-primary">{action.action}</TableCell>
                  <TableCell className="text-muted-foreground">{action.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;

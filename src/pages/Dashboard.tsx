import { KPICard } from "@/components/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Sun, Droplet, Waves, Zap, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Badge } from "@/components/ui/badge";

const siteData = {
  "Site A": {
    kpi: [
      { title: "Temperature", value: "24.5", unit: "°C", icon: Thermometer, status: "normal" as const, description: "Culture Tank" },
      { title: "pH Level", value: "7.2", unit: "pH", icon: Droplet, status: "normal" as const, description: "Optimal Range" },
      { title: "Light Intensity", value: "850", unit: "μmol/m²s", icon: Sun, status: "warning" as const, description: "LED Strip" },
      { title: "Ultrasonic Level", value: "78", unit: "%", icon: Waves, status: "normal" as const, description: "Tank Level" },
      { title: "Conductivity", value: "1.85", unit: "mS/cm", icon: Zap, status: "normal" as const, description: "Nutrient Conc." },
      { title: "Turbidity", value: "245", unit: "NTU", icon: Eye, status: "normal" as const, description: "Cell Density" },
    ],
    tempChart: [
      { time: "00:00", value: 24.2 },
      { time: "04:00", value: 24.1 },
      { time: "08:00", value: 24.5 },
      { time: "12:00", value: 25.1 },
      { time: "16:00", value: 24.8 },
      { time: "20:00", value: 24.3 },
    ],
    turbidityChart: [
      { time: "00:00", value: 220 },
      { time: "04:00", value: 228 },
      { time: "08:00", value: 235 },
      { time: "12:00", value: 242 },
      { time: "16:00", value: 248 },
      { time: "20:00", value: 245 },
    ],
    alerts: [
      { id: 1, time: "2024-01-15 14:32", message: "Light intensity above optimal range", severity: "warning" },
      { id: 2, time: "2024-01-15 12:15", message: "Conductivity stable at target level", severity: "info" },
      { id: 3, time: "2024-01-15 09:47", message: "Temperature spike detected briefly", severity: "warning" },
    ],
  },
  "Site B": {
    kpi: [
      { title: "Temperature", value: "26.8", unit: "°C", icon: Thermometer, status: "warning" as const, description: "Culture Tank" },
      { title: "pH Level", value: "7.8", unit: "pH", icon: Droplet, status: "normal" as const, description: "Optimal Range" },
      { title: "Light Intensity", value: "920", unit: "μmol/m²s", icon: Sun, status: "normal" as const, description: "LED Strip" },
      { title: "Ultrasonic Level", value: "65", unit: "%", icon: Waves, status: "warning" as const, description: "Tank Level" },
      { title: "Conductivity", value: "2.12", unit: "mS/cm", icon: Zap, status: "warning" as const, description: "Nutrient Conc." },
      { title: "Turbidity", value: "312", unit: "NTU", icon: Eye, status: "normal" as const, description: "Cell Density" },
    ],
    tempChart: [
      { time: "00:00", value: 26.3 },
      { time: "04:00", value: 26.5 },
      { time: "08:00", value: 26.8 },
      { time: "12:00", value: 27.2 },
      { time: "16:00", value: 26.9 },
      { time: "20:00", value: 26.6 },
    ],
    turbidityChart: [
      { time: "00:00", value: 285 },
      { time: "04:00", value: 292 },
      { time: "08:00", value: 300 },
      { time: "12:00", value: 308 },
      { time: "16:00", value: 315 },
      { time: "20:00", value: 312 },
    ],
    alerts: [
      { id: 1, time: "2024-01-15 15:18", message: "Temperature exceeding threshold", severity: "warning" },
      { id: 2, time: "2024-01-15 13:42", message: "Low tank level detected", severity: "warning" },
      { id: 3, time: "2024-01-15 10:22", message: "pH level stabilized after adjustment", severity: "info" },
    ],
  },
};

interface DashboardProps {
  currentSite: string;
}

const Dashboard = ({ currentSite }: DashboardProps) => {
  const data = siteData[currentSite as keyof typeof siteData] || siteData["Site A"];
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analysis</h1>
          <p className="text-muted-foreground">Real-time photobioreactor monitoring system</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-accent rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">Live Data</span>
        </div>
      </div>

      {/* KPI Cards - 6 sensors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {data.kpi.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-chart-1" />
              Temperature Trend (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.tempChart}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  fill="url(#tempGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-chart-2" />
              Turbidity / Cell Density (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.turbidityChart}>
                <defs>
                  <linearGradient id="turbidityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  fill="url(#turbidityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 bg-chart-3 rounded-full" />
            Recent System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-start gap-3">
                  <Badge variant={alert.severity === "warning" ? "destructive" : "secondary"} className="text-xs mt-0.5">
                    {alert.severity}
                  </Badge>
                  <p className="text-sm text-foreground">{alert.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">{alert.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

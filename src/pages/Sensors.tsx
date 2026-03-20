import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const siteData = {
  "Site A": {
    chart: [
      { time: "00:00", temp: 24.2, ph: 7.1, light: 820, ultrasonic: 78, conductivity: 1.82, turbidity: 220 },
      { time: "04:00", temp: 24.1, ph: 7.2, light: 830, ultrasonic: 77, conductivity: 1.84, turbidity: 228 },
      { time: "08:00", temp: 24.5, ph: 7.2, light: 850, ultrasonic: 78, conductivity: 1.85, turbidity: 235 },
      { time: "12:00", temp: 25.1, ph: 7.3, light: 880, ultrasonic: 79, conductivity: 1.86, turbidity: 242 },
      { time: "16:00", temp: 24.8, ph: 7.2, light: 860, ultrasonic: 78, conductivity: 1.85, turbidity: 248 },
      { time: "20:00", temp: 24.3, ph: 7.1, light: 840, ultrasonic: 78, conductivity: 1.85, turbidity: 245 },
    ],
    readings: [
      { id: 1, timestamp: "2024-01-15 14:30", sensor: "Temperature", value: "24.5°C", status: "Normal" },
      { id: 2, timestamp: "2024-01-15 14:30", sensor: "pH", value: "7.2", status: "Normal" },
      { id: 3, timestamp: "2024-01-15 14:30", sensor: "Light Intensity", value: "850 μmol/m²s", status: "Warning" },
      { id: 4, timestamp: "2024-01-15 14:30", sensor: "Ultrasonic", value: "78%", status: "Normal" },
      { id: 5, timestamp: "2024-01-15 14:30", sensor: "Conductivity", value: "1.85 mS/cm", status: "Normal" },
      { id: 6, timestamp: "2024-01-15 14:30", sensor: "Turbidity", value: "245 NTU", status: "Normal" },
      { id: 7, timestamp: "2024-01-15 14:15", sensor: "Temperature", value: "24.4°C", status: "Normal" },
      { id: 8, timestamp: "2024-01-15 14:15", sensor: "pH", value: "7.1", status: "Normal" },
    ],
  },
  "Site B": {
    chart: [
      { time: "00:00", temp: 26.3, ph: 7.7, light: 890, ultrasonic: 65, conductivity: 2.08, turbidity: 285 },
      { time: "04:00", temp: 26.5, ph: 7.8, light: 900, ultrasonic: 64, conductivity: 2.10, turbidity: 292 },
      { time: "08:00", temp: 26.8, ph: 7.8, light: 920, ultrasonic: 65, conductivity: 2.12, turbidity: 300 },
      { time: "12:00", temp: 27.2, ph: 7.9, light: 950, ultrasonic: 66, conductivity: 2.14, turbidity: 308 },
      { time: "16:00", temp: 26.9, ph: 7.8, light: 930, ultrasonic: 65, conductivity: 2.12, turbidity: 315 },
      { time: "20:00", temp: 26.6, ph: 7.7, light: 910, ultrasonic: 65, conductivity: 2.12, turbidity: 312 },
    ],
    readings: [
      { id: 1, timestamp: "2024-01-15 14:30", sensor: "Temperature", value: "26.8°C", status: "Warning" },
      { id: 2, timestamp: "2024-01-15 14:30", sensor: "pH", value: "7.8", status: "Normal" },
      { id: 3, timestamp: "2024-01-15 14:30", sensor: "Light Intensity", value: "920 μmol/m²s", status: "Normal" },
      { id: 4, timestamp: "2024-01-15 14:30", sensor: "Ultrasonic", value: "65%", status: "Warning" },
      { id: 5, timestamp: "2024-01-15 14:30", sensor: "Conductivity", value: "2.12 mS/cm", status: "Warning" },
      { id: 6, timestamp: "2024-01-15 14:30", sensor: "Turbidity", value: "312 NTU", status: "Normal" },
      { id: 7, timestamp: "2024-01-15 14:15", sensor: "Temperature", value: "26.7°C", status: "Warning" },
      { id: 8, timestamp: "2024-01-15 14:15", sensor: "pH", value: "7.7", status: "Normal" },
    ],
  },
};

const sensorKeyMap: Record<string, string> = {
  temp: "Temperature",
  ph: "pH",
  light: "Light Intensity",
  ultrasonic: "Ultrasonic",
  conductivity: "Conductivity",
  turbidity: "Turbidity",
};

interface SensorsProps {
  currentSite: string;
}

const Sensors = ({ currentSite }: SensorsProps) => {
  const [selectedSensor, setSelectedSensor] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const data = siteData[currentSite as keyof typeof siteData] || siteData["Site A"];

  const filteredReadings = selectedSensor === "all" 
    ? data.readings 
    : data.readings.filter(r => r.sensor === sensorKeyMap[selectedSensor]);

  const getVisibleLines = () => {
    if (selectedSensor === "all") {
      return { temp: true, ph: true, light: true, ultrasonic: true, conductivity: true, turbidity: true };
    }
    return {
      temp: selectedSensor === "temp",
      ph: selectedSensor === "ph",
      light: selectedSensor === "light",
      ultrasonic: selectedSensor === "ultrasonic",
      conductivity: selectedSensor === "conductivity",
      turbidity: selectedSensor === "turbidity",
    };
  };

  const visibleLines = getVisibleLines();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sensors</h1>
          <p className="text-muted-foreground">Historical sensor readings and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-accent rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">Streaming</span>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSensor} onValueChange={setSelectedSensor}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sensor Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sensors</SelectItem>
            <SelectItem value="temp">Temperature</SelectItem>
            <SelectItem value="ph">pH Level</SelectItem>
            <SelectItem value="light">Light Intensity</SelectItem>
            <SelectItem value="ultrasonic">Ultrasonic Level</SelectItem>
            <SelectItem value="conductivity">Conductivity</SelectItem>
            <SelectItem value="turbidity">Turbidity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 bg-chart-1 rounded-full" />
            {selectedSensor === "all" ? "Multi-Sensor Trends" : `${sensorKeyMap[selectedSensor]} Trend`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} 
              />
              <Legend />
              {visibleLines.temp && <Line yAxisId="left" type="monotone" dataKey="temp" name="Temperature (°C)" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-1))", r: 3 }} />}
              {visibleLines.ph && <Line yAxisId="left" type="monotone" dataKey="ph" name="pH" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))", r: 3 }} />}
              {visibleLines.light && <Line yAxisId="right" type="monotone" dataKey="light" name="Light (μmol/m²s)" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-3))", r: 3 }} />}
              {visibleLines.ultrasonic && <Line yAxisId="left" type="monotone" dataKey="ultrasonic" name="Tank Level (%)" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-4))", r: 3 }} />}
              {visibleLines.conductivity && <Line yAxisId="left" type="monotone" dataKey="conductivity" name="Conductivity (mS/cm)" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-5))", r: 3 }} />}
              {visibleLines.turbidity && <Line yAxisId="right" type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Historical Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Sensor</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReadings.map((reading) => (
                <TableRow key={reading.id} className="hover:bg-secondary/30">
                  <TableCell className="font-mono text-sm">{reading.timestamp}</TableCell>
                  <TableCell>{reading.sensor}</TableCell>
                  <TableCell className="font-semibold">{reading.value}</TableCell>
                  <TableCell>
                    <Badge variant={reading.status === "Normal" ? "secondary" : "destructive"} className="text-xs">
                      {reading.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sensors;

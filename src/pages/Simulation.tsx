import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, Loader2, FlaskConical, BookOpen } from "lucide-react";

interface SimulationProps {
  currentSite: string;
}

const Simulation = ({ currentSite }: SimulationProps) => {
  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Simulation</h1>
        <p className="text-muted-foreground">Predictive modeling and scenario analysis for {currentSite}</p>
      </div>

      <Tabs defaultValue="empirical" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="empirical" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Empirical Simulation
          </TabsTrigger>
          <TabsTrigger value="theoretical" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Theoretical Simulation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empirical" className="flex items-center justify-center">
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 max-w-lg w-full">
            <CardContent className="p-12 text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-6 rounded-full bg-secondary/50 border border-border">
                  <FlaskConical className="h-16 w-16 text-primary" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-3">Empirical Simulation</h2>
              <p className="text-muted-foreground mb-6">
                Data-driven modeling based on historical sensor readings and experimental results
              </p>
              
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50 mb-6">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Under Development</span>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Features in progress:</p>
                <ul className="space-y-1">
                  <li className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-1" />
                    Historical data analysis models
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                    Regression-based growth predictions
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-3" />
                    Sensor correlation mapping
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theoretical" className="flex items-center justify-center">
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 max-w-lg w-full">
            <CardContent className="p-12 text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-chart-2/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-6 rounded-full bg-secondary/50 border border-border">
                  <BookOpen className="h-16 w-16 text-chart-2" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-3">Theoretical Simulation</h2>
              <p className="text-muted-foreground mb-6">
                Physics-based modeling using microalgae growth kinetics and environmental equations
              </p>
              
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50 mb-6">
                <Loader2 className="h-5 w-5 text-chart-2 animate-spin" />
                <span className="text-sm text-muted-foreground">Under Development</span>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Features in progress:</p>
                <ul className="space-y-1">
                  <li className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-1" />
                    Monod kinetics modeling
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                    Light attenuation equations
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-3" />
                    Nutrient uptake dynamics
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Simulation;

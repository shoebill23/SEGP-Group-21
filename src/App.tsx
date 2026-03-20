import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Sensors from "./pages/Sensors";
import Alerts from "./pages/Alerts";
import Simulation from "./pages/Simulation";
import Users from "./pages/Users";
import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";
import { hasAccessToRoute } from "@/lib/rolePermissions";

const queryClient = new QueryClient();

/**
 * Main layout component that shows dashboard UI
 * Only rendered when user is authenticated
 */
function DashboardLayout({ currentSite, onSiteChange }: { currentSite: string; onSiteChange: (site: string) => void }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar userRole={user.role} />
        <div className="flex-1 flex flex-col">
          <AppHeader 
            currentSite={currentSite} 
            onSiteChange={onSiteChange}
            userName={user.name}
            userRole={user.role}
            onLogout={logout}
          />
          <main className="flex-1 overflow-auto">
            <Routes>
              {/* Dashboard Routes */}
              <Route 
                path="/" 
                element={<ProtectedRoute><Dashboard currentSite={currentSite} /></ProtectedRoute>} 
              />
              <Route 
                path="/sensors" 
                element={<ProtectedRoute><Sensors currentSite={currentSite} /></ProtectedRoute>} 
              />
              <Route 
                path="/alerts" 
                element={<ProtectedRoute><Alerts currentSite={currentSite} /></ProtectedRoute>} 
              />
              <Route 
                path="/simulation" 
                element={
                  <ProtectedRoute>
                    {hasAccessToRoute(user.role, "/simulation") ? (
                      <Simulation currentSite={currentSite} />
                    ) : (
                      <Navigate to="/access-denied" replace />
                    )}
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute>
                    {hasAccessToRoute(user.role, "/users") ? (
                      <Users />
                    ) : (
                      <Navigate to="/access-denied" replace />
                    )}
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all for unknown dashboard routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

/**
 * Protected Dashboard Layout Wrapper
 * Ensures only authenticated users can access the dashboard
 */
function ProtectedDashboard({ currentSite, onSiteChange }: { currentSite: string; onSiteChange: (site: string) => void }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout currentSite={currentSite} onSiteChange={onSiteChange} />;
}

/**
 * Main App Component
 */
const App = () => {
  const [currentSite, setCurrentSite] = useState("Site A");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Authentication Pages */}
              <Route path="/login" element={<Login />} />
              <Route path="/access-denied" element={<AccessDenied />} />

              {/* Dashboard - Protected */}
              <Route 
                path="/*" 
                element={
                  <ProtectedDashboard 
                    currentSite={currentSite} 
                    onSiteChange={setCurrentSite} 
                  />
                } 
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

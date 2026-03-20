import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasAccessToRoute } from "@/lib/rolePermissions";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "Admin" | "Manager" | "Worker";
}

/**
 * ProtectedRoute Component
 * Protects routes from unauthorized access.
 * Redirects to login if not authenticated.
 * Redirects to access-denied if user lacks permissions.
 *
 * @param children The component to render if authorized
 * @param requiredRole Optional specific role requirement
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading state while checking authentication
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

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-specific permissions if required
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

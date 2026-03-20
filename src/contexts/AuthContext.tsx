import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * User role type definition
 */
export type UserRole = "Admin" | "Manager" | "Worker";

/**
 * Authenticated user information
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

/**
 * Create the authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Manages user authentication state and provides auth methods
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize authentication from stored session on mount
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication by checking for stored session
   */
  const initializeAuth = () => {
    try {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to restore auth session:", error);
      localStorage.removeItem("auth_user");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login method - authenticates user and stores session
   * @param email User email
   * @param password User password
   * @throws {Error} If authentication fails
   */
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock user database - in production, this would call an actual backend
      const mockUsers: Record<string, { password: string; user: User }> = {
        "admin@algae.com": {
          password: "admin123",
          user: {
            id: "1",
            email: "admin@algae.com",
            name: "Admin User",
            role: "Admin",
          },
        },
        "manager@algae.com": {
          password: "manager123",
          user: {
            id: "2",
            email: "manager@algae.com",
            name: "Manager User",
            role: "Manager",
          },
        },
        "worker@algae.com": {
          password: "worker123",
          user: {
            id: "3",
            email: "worker@algae.com",
            name: "Worker User",
            role: "Worker",
          },
        },
      };

      // Validate credentials
      const userRecord = mockUsers[email];
      if (!userRecord || userRecord.password !== password) {
        throw new Error("Invalid email or password");
      }

      // Store user session
      setUser(userRecord.user);
      localStorage.setItem("auth_user", JSON.stringify(userRecord.user));
    } catch (error) {
      setUser(null);
      localStorage.removeItem("auth_user");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout method - clears user session
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

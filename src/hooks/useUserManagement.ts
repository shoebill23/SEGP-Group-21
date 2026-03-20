import { useState, useEffect, useCallback } from "react";
import { User, UserRole } from "@/contexts/AuthContext";

/**
 * Hook for managing system users with persistence
 */
export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize users from localStorage
   */
  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * Load users from localStorage with default fallback
   */
  const loadUsers = useCallback(() => {
    try {
      const storedUsers = localStorage.getItem("system_users");
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Initialize with default users if not exists
        const defaultUsers: User[] = [
          {
            id: "1",
            email: "john.worker@microalgae.com",
            name: "John Worker",
            role: "Worker",
          },
          {
            id: "2",
            email: "sarah.manager@microalgae.com",
            name: "Sarah Manager",
            role: "Manager",
          },
          {
            id: "3",
            email: "admin@microalgae.com",
            name: "Admin User",
            role: "Admin",
          },
          {
            id: "4",
            email: "mike.worker@microalgae.com",
            name: "Mike Worker",
            role: "Worker",
          },
          {
            id: "5",
            email: "lisa.manager@microalgae.com",
            name: "Lisa Manager",
            role: "Manager",
          },
        ];
        setUsers(defaultUsers);
        localStorage.setItem("system_users", JSON.stringify(defaultUsers));
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save users to localStorage
   */
  const persistUsers = useCallback((usersToSave: User[]) => {
    try {
      localStorage.setItem("system_users", JSON.stringify(usersToSave));
    } catch (error) {
      console.error("Failed to persist users:", error);
    }
  }, []);

  /**
   * Add a new user
   */
  const addUser = useCallback(
    (userData: Omit<User, "id">) => {
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      persistUsers(updatedUsers);
      return newUser;
    },
    [users, persistUsers]
  );

  /**
   * Update an existing user
   */
  const updateUser = useCallback(
    (userId: string, updates: Partial<Omit<User, "id">>) => {
      const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, ...updates } : user
      );
      setUsers(updatedUsers);
      persistUsers(updatedUsers);
    },
    [users, persistUsers]
  );

  /**
   * Delete a user
   */
  const deleteUser = useCallback(
    (userId: string) => {
      const updatedUsers = users.filter((user) => user.id !== userId);
      setUsers(updatedUsers);
      persistUsers(updatedUsers);
    },
    [users, persistUsers]
  );

  /**
   * Get user by ID
   */
  const getUserById = useCallback(
    (userId: string) => {
      return users.find((user) => user.id === userId);
    },
    [users]
  );

  /**
   * Check if email already exists (for validation)
   */
  const emailExists = useCallback(
    (email: string, excludeId?: string) => {
      return users.some((user) => user.email === email && user.id !== excludeId);
    },
    [users]
  );

  return {
    users,
    isLoading,
    addUser,
    updateUser,
    deleteUser,
    getUserById,
    emailExists,
  };
}

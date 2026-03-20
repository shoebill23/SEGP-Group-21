import { UserRole } from "@/contexts/AuthContext";

/**
 * Permission configuration for each role
 * Defines which pages and features are accessible for each role
 */
export const rolePermissions: Record<UserRole, string[]> = {
  Admin: ["/", "/sensors", "/alerts", "/simulation", "/users"],
  Manager: ["/", "/sensors", "/alerts", "/simulation"],
  Worker: ["/", "/sensors", "/alerts"],
};

/**
 * Check if a user role has access to a specific route
 * @param role User role
 * @param route Route path to check
 * @returns True if role has access, false otherwise
 */
export function hasAccessToRoute(role: UserRole, route: string): boolean {
  const permissions = rolePermissions[role];
  return permissions.includes(route);
}

/**
 * Get accessible routes for a role
 * @param role User role
 * @returns Array of accessible route paths
 */
export function getAccessibleRoutes(role: UserRole): string[] {
  return rolePermissions[role];
}

/**
 * Check if role has admin access
 * @param role User role
 * @returns True if Admin role
 */
export function isAdmin(role: UserRole): boolean {
  return role === "Admin";
}

/**
 * Check if role has manager or higher access
 * @param role User role
 * @returns True if Manager or Admin
 */
export function isManagerOrAbove(role: UserRole): boolean {
  return role === "Manager" || role === "Admin";
}

/**
 * Get menu items for a role
 * @param role User role
 * @returns Filtered menu items
 */
export function getMenuItemsForRole(
  role: UserRole,
  allItems: Array<{ url: string; [key: string]: unknown }>
) {
  return allItems.filter((item) => hasAccessToRoute(role, item.url as string));
}

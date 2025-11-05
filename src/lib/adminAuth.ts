// Client-side admin utilities
export interface AdminUser {
  clerkId: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/**
 * Check if user has admin role from public metadata
 */
export function checkAdminRole(publicMetadata: any): boolean {
  return publicMetadata?.role === "admin";
}

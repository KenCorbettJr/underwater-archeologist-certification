import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export interface AdminUser {
  clerkId: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/**
 * Check if a user has admin role based on Clerk metadata
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Check if user has admin role in metadata
    const role = user.publicMetadata?.role as string;
    return role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get current user's admin status
 */
export async function getCurrentUserAdminStatus(): Promise<{
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { isAuthenticated: false, isAdmin: false };
    }

    const isAdmin = await isUserAdmin(userId);

    return {
      isAuthenticated: true,
      isAdmin,
      userId,
    };
  } catch (error) {
    console.error("Error getting current user admin status:", error);
    return { isAuthenticated: false, isAdmin: false };
  }
}

/**
 * Require admin authentication - redirect if not admin
 */
export async function requireAdmin(): Promise<string> {
  const { isAuthenticated, isAdmin, userId } =
    await getCurrentUserAdminStatus();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return userId!;
}

/**
 * Assign admin role to a user
 */
export async function assignAdminRole(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "admin",
        adminLevel: "super",
      },
    });
    return true;
  } catch (error) {
    console.error("Error assigning admin role:", error);
    return false;
  }
}

/**
 * Remove admin role from a user
 */
export async function removeAdminRole(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "user",
      },
    });
    return true;
  } catch (error) {
    console.error("Error removing admin role:", error);
    return false;
  }
}

/**
 * Get admin user information
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = await isUserAdmin(userId);

    return {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      name:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.username || "Unknown",
      isAdmin,
    };
  } catch (error) {
    console.error("Error getting admin user:", error);
    return null;
  }
}

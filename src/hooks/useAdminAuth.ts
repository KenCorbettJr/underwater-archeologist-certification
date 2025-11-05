"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export interface AdminAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

/**
 * Hook to check admin authentication status
 */
export function useAdminAuth(): AdminAuthState {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      // Check if user has admin role in metadata
      const role = user.publicMetadata?.role as string;
      setIsAdmin(role === "admin");
      setIsCheckingAdmin(false);
    } else if (isLoaded) {
      setIsAdmin(false);
      setIsCheckingAdmin(false);
    }
  }, [isLoaded, user]);

  return {
    isLoading: !isLoaded || isCheckingAdmin,
    isAuthenticated: !!user,
    isAdmin,
    user: user
      ? {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          name:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username || "Unknown",
        }
      : null,
  };
}

/**
 * Hook to require admin authentication
 * Redirects to home if not admin
 */
export function useRequireAdmin() {
  const adminAuth = useAdminAuth();

  useEffect(() => {
    if (
      !adminAuth.isLoading &&
      adminAuth.isAuthenticated &&
      !adminAuth.isAdmin
    ) {
      // Redirect to home if not admin
      window.location.href = "/";
    }
  }, [adminAuth.isLoading, adminAuth.isAuthenticated, adminAuth.isAdmin]);

  return adminAuth;
}

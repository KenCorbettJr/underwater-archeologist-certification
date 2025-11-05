"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side admin guard that ensures user is authenticated and has admin role
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // Get user's admin status from Convex
  const adminStatus = useQuery(
    api.adminAuth.getCurrentUserAdminStatus,
    isSignedIn && user ? { clerkId: user.id } : undefined
  );

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const currentUrl = window.location.pathname + window.location.search;
      const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`;
      router.push(signInUrl);
    } else if (
      isLoaded &&
      isSignedIn &&
      adminStatus !== undefined &&
      !adminStatus?.isAdmin
    ) {
      // User is authenticated but not admin, redirect to home
      router.push("/");
    }
  }, [isLoaded, isSignedIn, adminStatus, router]);

  // Show loading state while data is loading
  if (!isLoaded || (isSignedIn && adminStatus === undefined)) {
    return (
      <div className="min-h-screen wave-bg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sand-400 mx-auto mb-4"></div>
          <div>Verifying permissions...</div>
        </div>
      </div>
    );
  }

  // Show fallback if not signed in
  if (!isSignedIn) {
    return (
      fallback || (
        <div className="min-h-screen wave-bg flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p>Redirecting to sign in...</p>
          </div>
        </div>
      )
    );
  }

  // Show fallback if not admin
  if (!adminStatus?.isAdmin) {
    return (
      fallback || (
        <div className="min-h-screen wave-bg flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p>You don't have permission to access this area.</p>
            <p>Redirecting to home page...</p>
          </div>
        </div>
      )
    );
  }

  // User is authenticated and is admin, render children
  return <>{children}</>;
}

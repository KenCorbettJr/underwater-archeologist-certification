"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { checkAdminRole } from "../../lib/adminAuth";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side admin guard that ensures user is authenticated and has admin role
 * Uses Clerk's public metadata to check admin status
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // Check admin status from Clerk's public metadata
  const isAdmin = user ? checkAdminRole(user.publicMetadata) : false;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const currentUrl = window.location.pathname + window.location.search;
      const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`;
      router.push(signInUrl);
    } else if (isLoaded && isSignedIn && !isAdmin) {
      // User is authenticated but not admin, redirect to home
      router.push("/");
    }
  }, [isLoaded, isSignedIn, isAdmin, router]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
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
  if (!isAdmin) {
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

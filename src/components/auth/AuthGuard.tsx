"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Client-side authentication guard that ensures user is authenticated
 * before rendering children components
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = "/sign-in",
}: AuthGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const currentUrl = window.location.pathname + window.location.search;
      const signInUrl = `${redirectTo}?redirect_url=${encodeURIComponent(currentUrl)}`;
      router.push(signInUrl);
    }
  }, [isLoaded, isSignedIn, router, redirectTo]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen wave-bg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sand-400 mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Show fallback or redirect if not signed in
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

  // User is authenticated, render children
  return <>{children}</>;
}

/**
 * Hook to get authenticated user data with proper error handling
 */
export function useAuthenticatedUser() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    throw new Error("User data is still loading");
  }

  if (!isSignedIn || !user) {
    throw new Error("User is not authenticated");
  }

  return user;
}

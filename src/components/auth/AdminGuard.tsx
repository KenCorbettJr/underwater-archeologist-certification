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
    }
    // Don't automatically redirect non-admin users - let them see the access request page
  }, [isLoaded, isSignedIn, router]);

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
          <div className="text-center text-white max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
            <p className="mb-6">
              You don't have admin permissions to access this area.
            </p>

            {/* Debug information */}
            <div className="bg-black bg-opacity-30 p-4 rounded-lg text-left text-sm mb-6">
              <h3 className="font-bold mb-2">Your Account:</h3>
              <div>Email: {user?.emailAddresses[0]?.emailAddress}</div>
              <div>
                Current Role: {(user?.publicMetadata?.role as string) || "user"}
              </div>
              <div>Required Role: admin</div>
            </div>

            <div className="space-y-4">
              <p className="text-sm">
                If you should have admin access, you can:
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/admin/setup"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Request Admin Access
                </a>
                <a
                  href="/"
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Back to Home
                </a>
              </div>

              <p className="text-xs mt-4 text-gray-300">
                Contact your system administrator if you need help with admin
                access.
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  // User is authenticated and is admin, render children
  return <>{children}</>;
}

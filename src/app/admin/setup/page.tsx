"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AdminSetupPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState("");
  const [adminStatus, setAdminStatus] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      checkAdminStatus();
    }
  }, [isLoaded, isSignedIn, user]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/admin/check-status");
      const status = await response.json();
      setAdminStatus(status);

      // If user is already admin, redirect to admin dashboard
      if (status.isAdmin) {
        router.push("/admin");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const assignAdminRole = async () => {
    if (!user) return;

    setIsAssigning(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/assign-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          makeAdmin: true,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage("Admin role assigned successfully! Redirecting...");
        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      } else {
        setMessage(result.error || "Failed to assign admin role");
      }
    } catch (error) {
      console.error("Error assigning admin role:", error);
      setMessage("Error assigning admin role");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Setup</h1>
          <p className="text-gray-600">
            Assign admin role to access the admin dashboard
          </p>
        </div>

        {adminStatus && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Current Status:</h3>
            <div className="text-sm space-y-1">
              <div>User: {adminStatus.user?.name || "Unknown"}</div>
              <div>Email: {adminStatus.user?.email}</div>
              <div>Role: {adminStatus.user?.role || "user"}</div>
              <div>Is Admin: {adminStatus.isAdmin ? "Yes" : "No"}</div>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.includes("successfully")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={assignAdminRole}
            disabled={isAssigning || adminStatus?.isAdmin}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isAssigning
              ? "Assigning Admin Role..."
              : adminStatus?.isAdmin
                ? "Already Admin"
                : "Assign Admin Role to Me"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>
            This page allows you to assign admin privileges to your account.
            Only use this if you are the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useUser } from "@clerk/nextjs";
import { checkAdminRole } from "../../lib/adminAuth";

export function AdminDebug() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading user data...</div>;
  }

  if (!isSignedIn || !user) {
    return <div>Not signed in</div>;
  }

  const isAdmin = checkAdminRole(user.publicMetadata);

  return (
    <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono">
      <h3 className="font-bold mb-2">Admin Debug Info:</h3>
      <div className="space-y-1">
        <div>User ID: {user.id}</div>
        <div>Email: {user.emailAddresses[0]?.emailAddress}</div>
        <div>
          Name: {user.firstName} {user.lastName}
        </div>
        <div>Is Admin: {isAdmin ? "YES" : "NO"}</div>
        <div>
          Public Metadata: {JSON.stringify(user.publicMetadata, null, 2)}
        </div>
      </div>
    </div>
  );
}

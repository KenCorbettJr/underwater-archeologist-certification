"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminRoleManagerProps {
  onRoleAssigned?: (userId: string, isAdmin: boolean) => void;
}

export function AdminRoleManager({ onRoleAssigned }: AdminRoleManagerProps) {
  const adminAuth = useAdminAuth();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState("");

  const users = useQuery(api.adminAuth.getAllUsersForAdmin, {});
  const logAdminAction = useMutation(api.adminAuth.logAdminAction);

  const handleAssignAdmin = async (userId: string, makeAdmin: boolean) => {
    if (!adminAuth.user) return;

    setIsAssigning(true);
    setMessage("");

    try {
      // Call the API route to assign/remove admin role
      const response = await fetch("/api/admin/assign-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          makeAdmin,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Log the admin action
        await logAdminAction({
          adminClerkId: adminAuth.user.id,
          action: makeAdmin ? "assign_admin_role" : "remove_admin_role",
          resourceType: "user",
          resourceId: userId,
          details: `${makeAdmin ? "Assigned" : "Removed"} admin role`,
        });

        setMessage(result.message);
        onRoleAssigned?.(userId, makeAdmin);
      } else {
        setMessage(result.error || "Failed to update admin role");
      }
    } catch (error) {
      console.error("Error updating admin role:", error);
      setMessage("Error updating admin role");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!adminAuth.isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">
          Access denied. Admin privileges required.
        </p>
      </div>
    );
  }

  if (!users) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Admin Role Management</h3>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.includes("Successfully")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isAssigning}
          >
            <option value="">Select a user...</option>
            {users.map((user: any) => (
              <option key={user._id} value={user.clerkId}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {selectedUserId && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAssignAdmin(selectedUserId, true)}
              disabled={isAssigning}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isAssigning ? "Processing..." : "Assign Admin Role"}
            </button>
            <button
              onClick={() => handleAssignAdmin(selectedUserId, false)}
              disabled={isAssigning}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isAssigning ? "Processing..." : "Remove Admin Role"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Current Users</h4>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Level</th>
                <th className="text-left py-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user._id} className="border-b">
                  <td className="py-2">{user.name}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2 capitalize">{user.certificationLevel}</td>
                  <td className="py-2">{user.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

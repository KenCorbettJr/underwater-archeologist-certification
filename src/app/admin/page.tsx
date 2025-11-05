"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRequireAdmin } from "@/hooks/useAdminAuth";
import { AdminRoleManager } from "@/components/admin/AdminRoleManager";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const adminAuth = useRequireAdmin();
  const [isInitializing, setIsInitializing] = useState(false);
  const [message, setMessage] = useState("");
  const [showDatabaseTools, setShowDatabaseTools] = useState(false);
  const [showRoleManager, setShowRoleManager] = useState(false);

  const databaseStatus = useQuery(api.seedDatabase.checkDatabaseStatus, {});
  const initializeDatabase = useMutation(api.seedDatabase.initializeDatabase);
  const logAdminAction = useMutation(api.adminAuth.logAdminAction);

  const handleInitializeDatabase = async () => {
    setIsInitializing(true);
    setMessage("");
    try {
      const result = await initializeDatabase({});
      setMessage(result.message);

      // Log admin action
      if (adminAuth.user) {
        await logAdminAction({
          adminClerkId: adminAuth.user.id,
          action: "initialize_database",
          resourceType: "database",
          details: "Database initialization completed",
        });
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
      setMessage(`Failed to initialize database: ${error}`);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-700">
          System overview and content management
        </p>
      </div>

      {/* Main Dashboard */}
      <AdminDashboard />

      {/* Admin Tools Section */}
      <div className="mt-12 space-y-6">
        {/* Database Tools Section - Collapsible */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => setShowDatabaseTools(!showDatabaseTools)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🗄️</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Database Tools
                </h2>
              </div>
              <span className="text-gray-500">
                {showDatabaseTools ? "−" : "+"}
              </span>
            </button>
          </div>

          {showDatabaseTools && (
            <div className="p-6">
              {databaseStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {databaseStatus.artifactsCount}
                    </div>
                    <div className="text-sm text-gray-600">Artifacts</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {databaseStatus.sitesCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      Excavation Sites
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {databaseStatus.isInitialized ? "✓" : "✗"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {databaseStatus.isInitialized
                        ? "Initialized"
                        : "Not Ready"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <div className="text-gray-500">
                    Loading database status...
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Database Actions</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleInitializeDatabase}
                    disabled={isInitializing}
                    className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isInitializing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Initializing Database...
                      </div>
                    ) : (
                      "Initialize/Refresh Database"
                    )}
                  </button>

                  <div className="flex space-x-2">
                    <a
                      href="/admin/artifacts"
                      className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-center"
                    >
                      Manage Artifacts
                    </a>
                    <a
                      href="/admin/sites"
                      className="px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors text-center"
                    >
                      Manage Sites
                    </a>
                  </div>
                </div>

                {message && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">{message}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Role Management Section - Collapsible */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => setShowRoleManager(!showRoleManager)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👥</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Admin Role Management
                </h2>
              </div>
              <span className="text-gray-500">
                {showRoleManager ? "−" : "+"}
              </span>
            </button>
          </div>

          {showRoleManager && (
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Assign or remove admin roles for users. Admin users have
                  access to all content management features.
                </p>
              </div>
              <AdminRoleManager
                onRoleAssigned={(userId, isAdmin) => {
                  console.log(
                    `Role ${isAdmin ? "assigned" : "removed"} for user ${userId}`
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

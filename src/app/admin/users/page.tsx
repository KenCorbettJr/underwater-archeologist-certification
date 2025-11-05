"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { UserManagement } from "@/components/admin/UserManagement";

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          User Management
        </h1>
        <p className="text-lg text-gray-700">
          Monitor student progress, manage certifications, and view user
          analytics
        </p>
      </div>

      <UserManagement />
    </AdminLayout>
  );
}

"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ChallengeManagement } from "@/components/admin/ChallengeManagement";

export default function AdminChallengesPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Challenge Management
        </h1>
        <p className="text-lg text-gray-700">
          Create, edit, and manage challenges for the underwater archaeology
          learning platform
        </p>
      </div>

      <ChallengeManagement />
    </AdminLayout>
  );
}

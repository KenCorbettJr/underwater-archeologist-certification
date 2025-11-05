"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ArtifactManagement } from "@/components/admin/ArtifactManagement";

export default function AdminArtifactsPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Artifact Management
        </h1>
        <p className="text-lg text-gray-700">
          Create, edit, and manage artifacts for the underwater archaeology
          games
        </p>
      </div>

      <ArtifactManagement />
    </AdminLayout>
  );
}

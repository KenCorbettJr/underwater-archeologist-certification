"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ExcavationSiteManagement } from "@/components/admin/ExcavationSiteManagement";

export default function AdminSitesPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Excavation Site Management
        </h1>
        <p className="text-lg text-gray-700">
          Create, edit, and manage excavation sites for the underwater
          archaeology games
        </p>
      </div>

      <ExcavationSiteManagement />
    </AdminLayout>
  );
}

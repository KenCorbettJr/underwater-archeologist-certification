"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRequireAdmin } from "@/hooks/useAdminAuth";
import { ExcavationSiteForm } from "./ExcavationSiteForm";
import { ExcavationSiteList } from "./ExcavationSiteList";
import { Id } from "../../../convex/_generated/dataModel";

export type EnvironmentalConditions = {
  visibility: number;
  currentStrength: number;
  temperature: number;
  depth: number;
  sedimentType: string;
  timeConstraints: number;
};

export type SiteArtifact = {
  artifactId: Id<"gameArtifacts">;
  gridPosition: {
    x: number;
    y: number;
  };
  depth: number;
  isDiscovered: boolean;
  condition: "excellent" | "good" | "fair" | "poor";
};

export type ExcavationSiteFormData = {
  name: string;
  location: string;
  historicalPeriod: string;
  description: string;
  gridWidth: number;
  gridHeight: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  environmentalConditions: EnvironmentalConditions;
  siteArtifacts: SiteArtifact[];
};

export function ExcavationSiteManagement() {
  const adminAuth = useRequireAdmin();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Id<"excavationSites"> | null>(
    null
  );
  const [includeInactive, setIncludeInactive] = useState(false);

  const sites = useQuery(
    api.adminExcavationSites.getAllExcavationSitesForAdmin,
    {
      includeInactive,
    }
  );
  const siteStats = useQuery(
    api.adminExcavationSites.getExcavationSiteStats,
    {}
  );
  const createSite = useMutation(api.adminExcavationSites.createExcavationSite);
  const updateSite = useMutation(api.adminExcavationSites.updateExcavationSite);
  const deleteSite = useMutation(api.adminExcavationSites.deleteExcavationSite);

  const handleCreateSite = async (data: ExcavationSiteFormData) => {
    if (!adminAuth.user) return;

    try {
      await createSite({
        adminClerkId: adminAuth.user.id,
        ...data,
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create excavation site:", error);
      throw error;
    }
  };

  const handleUpdateSite = async (data: ExcavationSiteFormData) => {
    if (!adminAuth.user || !editingSite) return;

    try {
      await updateSite({
        adminClerkId: adminAuth.user.id,
        siteId: editingSite,
        ...data,
      });
      setEditingSite(null);
    } catch (error) {
      console.error("Failed to update excavation site:", error);
      throw error;
    }
  };

  const handleDeleteSite = async (siteId: Id<"excavationSites">) => {
    if (!adminAuth.user) return;

    if (confirm("Are you sure you want to delete this excavation site?")) {
      try {
        await deleteSite({
          adminClerkId: adminAuth.user.id,
          siteId,
        });
      } catch (error) {
        console.error("Failed to delete excavation site:", error);
        alert("Failed to delete excavation site");
      }
    }
  };

  if (!sites || !siteStats) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading excavation sites...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Site Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {siteStats.total}
            </div>
            <div className="text-sm text-gray-600">Total Sites</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {siteStats.active}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {siteStats.byDifficulty.beginner}
            </div>
            <div className="text-sm text-gray-600">Beginner</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {siteStats.totalArtifactsPlaced}
            </div>
            <div className="text-sm text-gray-600">Artifacts Placed</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">
              {siteStats.averageArtifactsPerSite}
            </div>
            <div className="text-sm text-gray-600">Avg per Site</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Manage Excavation Sites</h2>
            <p className="text-gray-600">
              Create and manage excavation sites for the games
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Show inactive</span>
            </label>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Site
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingSite) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingSite
              ? "Edit Excavation Site"
              : "Create New Excavation Site"}
          </h3>
          <ExcavationSiteForm
            siteId={editingSite}
            onSubmit={editingSite ? handleUpdateSite : handleCreateSite}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingSite(null);
            }}
          />
        </div>
      )}

      {/* Site List */}
      <ExcavationSiteList
        sites={sites}
        onEdit={setEditingSite}
        onDelete={handleDeleteSite}
      />
    </div>
  );
}

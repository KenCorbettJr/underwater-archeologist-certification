"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRequireAdmin } from "@/hooks/useAdminAuth";
import { ArtifactForm } from "./ArtifactForm";
import { ArtifactList } from "./ArtifactList";
import { Id } from "../../../convex/_generated/dataModel";

export type ArtifactFormData = {
  name: string;
  description: string;
  historicalPeriod: string;
  culture: string;
  dateRange: string;
  significance: string;
  imageUrl: string;
  imageStorageId?: string;
  modelUrl?: string;
  discoveryLocation: string;
  conservationNotes: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
};

export function ArtifactManagement() {
  const adminAuth = useRequireAdmin();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingArtifact, setEditingArtifact] =
    useState<Id<"gameArtifacts"> | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const artifacts = useQuery(api.adminArtifacts.getAllArtifactsForAdmin, {
    includeInactive,
  });
  const artifactStats = useQuery(api.adminArtifacts.getArtifactStats, {});
  const createArtifact = useMutation(api.adminArtifacts.createArtifact);
  const updateArtifact = useMutation(api.adminArtifacts.updateArtifact);
  const deleteArtifact = useMutation(api.adminArtifacts.deleteArtifact);

  const handleCreateArtifact = async (data: ArtifactFormData) => {
    if (!adminAuth.user) return;

    try {
      await createArtifact({
        adminClerkId: adminAuth.user.id,
        ...data,
        imageStorageId: data.imageStorageId
          ? (data.imageStorageId as Id<"_storage">)
          : undefined,
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create artifact:", error);
      throw error;
    }
  };

  const handleUpdateArtifact = async (data: ArtifactFormData) => {
    if (!adminAuth.user || !editingArtifact) return;

    try {
      await updateArtifact({
        adminClerkId: adminAuth.user.id,
        artifactId: editingArtifact,
        ...data,
        imageStorageId: data.imageStorageId
          ? (data.imageStorageId as Id<"_storage">)
          : undefined,
      });
      setEditingArtifact(null);
    } catch (error) {
      console.error("Failed to update artifact:", error);
      throw error;
    }
  };

  const handleDeleteArtifact = async (artifactId: Id<"gameArtifacts">) => {
    if (!adminAuth.user) return;

    if (confirm("Are you sure you want to delete this artifact?")) {
      try {
        await deleteArtifact({
          adminClerkId: adminAuth.user.id,
          artifactId,
        });
      } catch (error) {
        console.error("Failed to delete artifact:", error);
        alert("Failed to delete artifact");
      }
    }
  };

  if (!artifacts || !artifactStats) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading artifacts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Artifact Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {artifactStats.total}
            </div>
            <div className="text-sm text-gray-600">Total Artifacts</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {artifactStats.active}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {artifactStats.byDifficulty.beginner}
            </div>
            <div className="text-sm text-gray-600">Beginner</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {artifactStats.byDifficulty.advanced}
            </div>
            <div className="text-sm text-gray-600">Advanced</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Manage Artifacts</h2>
            <p className="text-gray-600">
              Create and manage artifacts for the games
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
              Create Artifact
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingArtifact) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingArtifact ? "Edit Artifact" : "Create New Artifact"}
          </h3>
          <ArtifactForm
            artifactId={editingArtifact}
            onSubmit={
              editingArtifact ? handleUpdateArtifact : handleCreateArtifact
            }
            onCancel={() => {
              setShowCreateForm(false);
              setEditingArtifact(null);
            }}
          />
        </div>
      )}

      {/* Artifact List */}
      <ArtifactList
        artifacts={artifacts}
        onEdit={setEditingArtifact}
        onDelete={handleDeleteArtifact}
      />
    </div>
  );
}

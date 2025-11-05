"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRequireAdmin } from "@/hooks/useAdminAuth";
import { ChallengeForm } from "./ChallengeForm";
import { ChallengeList } from "./ChallengeList";
import { Id } from "../../../convex/_generated/dataModel";

export type ChallengeCategory =
  | "artifacts"
  | "techniques"
  | "history"
  | "conservation"
  | "fieldwork";
export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced";

export type ChallengeFormData = {
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  content: string;
  requiredLevel: ChallengeDifficulty;
  order: number;
};

export function ChallengeManagement() {
  const adminAuth = useRequireAdmin();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChallenge, setEditingChallenge] =
    useState<Id<"challenges"> | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ChallengeCategory | "">(
    ""
  );
  const [filterDifficulty, setFilterDifficulty] = useState<
    ChallengeDifficulty | ""
  >("");

  const challenges = useQuery(api.adminChallenges.getAllChallengesForAdmin, {
    includeInactive,
    category: filterCategory || undefined,
    difficulty: filterDifficulty || undefined,
  });
  const challengeStats = useQuery(api.adminChallenges.getChallengeStats, {});
  const createChallenge = useMutation(api.adminChallenges.createChallenge);
  const updateChallenge = useMutation(api.adminChallenges.updateChallenge);
  const deleteChallenge = useMutation(api.adminChallenges.deleteChallenge);

  const handleCreateChallenge = async (data: ChallengeFormData) => {
    if (!adminAuth.user) return;

    try {
      await createChallenge({
        adminClerkId: adminAuth.user.id,
        ...data,
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create challenge:", error);
      throw error;
    }
  };

  const handleUpdateChallenge = async (data: ChallengeFormData) => {
    if (!adminAuth.user || !editingChallenge) return;

    try {
      await updateChallenge({
        adminClerkId: adminAuth.user.id,
        challengeId: editingChallenge,
        ...data,
      });
      setEditingChallenge(null);
    } catch (error) {
      console.error("Failed to update challenge:", error);
      throw error;
    }
  };

  const handleDeleteChallenge = async (challengeId: Id<"challenges">) => {
    if (!adminAuth.user) return;

    if (confirm("Are you sure you want to delete this challenge?")) {
      try {
        await deleteChallenge({
          adminClerkId: adminAuth.user.id,
          challengeId,
        });
      } catch (error) {
        console.error("Failed to delete challenge:", error);
        alert("Failed to delete challenge");
      }
    }
  };

  if (!challenges || !challengeStats) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading challenges...</p>
      </div>
    );
  }

  const categories: {
    value: ChallengeCategory;
    label: string;
    icon: string;
  }[] = [
    { value: "artifacts", label: "Artifacts", icon: "🏺" },
    { value: "techniques", label: "Techniques", icon: "🔧" },
    { value: "history", label: "History", icon: "📚" },
    { value: "conservation", label: "Conservation", icon: "🛡️" },
    { value: "fieldwork", label: "Fieldwork", icon: "⛏️" },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Challenge Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {challengeStats.total}
            </div>
            <div className="text-sm text-gray-600">Total Challenges</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {challengeStats.active}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {challengeStats.averagePoints}
            </div>
            <div className="text-sm text-gray-600">Avg Points</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">
              {challengeStats.totalUserProgress}
            </div>
            <div className="text-sm text-gray-600">User Progress</div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((category) => (
            <div
              key={category.value}
              className="bg-gray-50 p-3 rounded-lg text-center"
            >
              <div className="text-lg mb-1">{category.icon}</div>
              <div className="text-sm font-medium text-gray-900">
                {challengeStats.byCategory[category.value]}
              </div>
              <div className="text-xs text-gray-600">{category.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Manage Challenges</h2>
            <p className="text-gray-600">
              Create and manage learning challenges
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="text-sm rounded border-gray-300"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as any)}
                className="text-sm rounded border-gray-300"
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="flex gap-2">
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
                Create Challenge
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingChallenge) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingChallenge ? "Edit Challenge" : "Create New Challenge"}
          </h3>
          <ChallengeForm
            challengeId={editingChallenge}
            onSubmit={
              editingChallenge ? handleUpdateChallenge : handleCreateChallenge
            }
            onCancel={() => {
              setShowCreateForm(false);
              setEditingChallenge(null);
            }}
          />
        </div>
      )}

      {/* Challenge List */}
      <ChallengeList
        challenges={challenges}
        onEdit={setEditingChallenge}
        onDelete={handleDeleteChallenge}
      />
    </div>
  );
}

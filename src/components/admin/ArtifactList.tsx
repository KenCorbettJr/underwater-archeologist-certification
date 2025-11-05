"use client";

import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";

interface Artifact {
  _id: Id<"gameArtifacts">;
  _creationTime: number;
  name: string;
  description: string;
  historicalPeriod: string;
  culture: string;
  dateRange: string;
  significance: string;
  imageUrl: string;
  modelUrl?: string;
  discoveryLocation: string;
  conservationNotes: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  isActive: boolean;
}

interface ArtifactListProps {
  artifacts: Artifact[];
  onEdit: (artifactId: Id<"gameArtifacts">) => void;
  onDelete: (artifactId: Id<"gameArtifacts">) => void;
}

export function ArtifactList({
  artifacts,
  onEdit,
  onDelete,
}: ArtifactListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  // Get unique categories for filter
  const categories = Array.from(
    new Set(artifacts.map((a) => a.category))
  ).sort();

  // Filter artifacts
  const filteredArtifacts = artifacts.filter((artifact) => {
    const matchesSearch =
      artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artifact.culture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artifact.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty =
      !filterDifficulty || artifact.difficulty === filterDifficulty;
    const matchesCategory =
      !filterCategory || artifact.category === filterCategory;

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search artifacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Artifact List */}
      <div className="divide-y divide-gray-200">
        {filteredArtifacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {artifacts.length === 0
              ? "No artifacts found"
              : "No artifacts match your filters"}
          </div>
        ) : (
          filteredArtifacts.map((artifact) => (
            <div key={artifact._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start space-x-4">
                {/* Artifact Image */}
                <div className="flex-shrink-0">
                  <img
                    src={artifact.imageUrl}
                    alt={artifact.name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder-artifact.png";
                    }}
                  />
                </div>

                {/* Artifact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {artifact.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {artifact.culture} • {artifact.historicalPeriod}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {artifact.description}
                      </p>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                          artifact.difficulty
                        )}`}
                      >
                        {artifact.difficulty}
                      </span>
                      {!artifact.isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Category: {artifact.category}</span>
                      <span>Location: {artifact.discoveryLocation}</span>
                      {artifact.dateRange && (
                        <span>Date: {artifact.dateRange}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(artifact._id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(artifact._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results count */}
      {filteredArtifacts.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 border-t">
          Showing {filteredArtifacts.length} of {artifacts.length} artifacts
        </div>
      )}
    </div>
  );
}

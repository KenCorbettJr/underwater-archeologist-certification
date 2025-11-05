"use client";

import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import {
  EnvironmentalConditions,
  SiteArtifact,
} from "./ExcavationSiteManagement";

interface ExcavationSite {
  _id: Id<"excavationSites">;
  _creationTime: number;
  name: string;
  location: string;
  historicalPeriod: string;
  description: string;
  gridWidth: number;
  gridHeight: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  environmentalConditions: EnvironmentalConditions;
  siteArtifacts: SiteArtifact[];
  isActive: boolean;
}

interface ExcavationSiteListProps {
  sites: ExcavationSite[];
  onEdit: (siteId: Id<"excavationSites">) => void;
  onDelete: (siteId: Id<"excavationSites">) => void;
}

export function ExcavationSiteList({
  sites,
  onEdit,
  onDelete,
}: ExcavationSiteListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("");
  const [expandedSite, setExpandedSite] =
    useState<Id<"excavationSites"> | null>(null);

  // Filter sites
  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.historicalPeriod.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty =
      !filterDifficulty || site.difficulty === filterDifficulty;

    return matchesSearch && matchesDifficulty;
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

  const toggleExpanded = (siteId: Id<"excavationSites">) => {
    setExpandedSite(expandedSite === siteId ? null : siteId);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
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
          </div>
        </div>
      </div>

      {/* Site List */}
      <div className="divide-y divide-gray-200">
        {filteredSites.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {sites.length === 0
              ? "No excavation sites found"
              : "No sites match your filters"}
          </div>
        ) : (
          filteredSites.map((site) => (
            <div key={site._id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {site.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                            site.difficulty
                          )}`}
                        >
                          {site.difficulty}
                        </span>
                        {!site.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mb-2">
                        {site.location} • {site.historicalPeriod}
                      </p>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {site.description}
                      </p>

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span>
                          Grid: {site.gridWidth} × {site.gridHeight}
                        </span>
                        <span>Artifacts: {site.siteArtifacts.length}</span>
                        <span>
                          Depth: {site.environmentalConditions.depth}m
                        </span>
                        <span>
                          Visibility: {site.environmentalConditions.visibility}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleExpanded(site._id)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {expandedSite === site._id ? "▼" : "▶"}
                  </button>
                  <button
                    onClick={() => onEdit(site._id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(site._id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSite === site._id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Environmental Conditions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Environmental Conditions
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Visibility:</span>
                          <span>
                            {site.environmentalConditions.visibility}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Current Strength:
                          </span>
                          <span>
                            {site.environmentalConditions.currentStrength}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Temperature:</span>
                          <span>
                            {site.environmentalConditions.temperature}°C
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Depth:</span>
                          <span>{site.environmentalConditions.depth}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sediment:</span>
                          <span className="capitalize">
                            {site.environmentalConditions.sedimentType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time Limit:</span>
                          <span>
                            {site.environmentalConditions.timeConstraints} min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Artifact Placement */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Artifact Placement ({site.siteArtifacts.length}{" "}
                        artifacts)
                      </h4>
                      {site.siteArtifacts.length > 0 ? (
                        <div className="space-y-2">
                          {site.siteArtifacts
                            .slice(0, 5)
                            .map((artifact, index) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-600">
                                  Position ({artifact.gridPosition.x},{" "}
                                  {artifact.gridPosition.y}):
                                </span>
                                <span>
                                  Depth {artifact.depth}, {artifact.condition}
                                </span>
                              </div>
                            ))}
                          {site.siteArtifacts.length > 5 && (
                            <div className="text-sm text-gray-500">
                              ... and {site.siteArtifacts.length - 5} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No artifacts placed
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Results count */}
      {filteredSites.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 border-t">
          Showing {filteredSites.length} of {sites.length} excavation sites
        </div>
      )}
    </div>
  );
}

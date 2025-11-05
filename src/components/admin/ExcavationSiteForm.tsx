"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  ExcavationSiteFormData,
  EnvironmentalConditions,
  SiteArtifact,
} from "./ExcavationSiteManagement";
import { ArtifactPlacementGrid } from "./ArtifactPlacementGrid";

interface ExcavationSiteFormProps {
  siteId?: Id<"excavationSites"> | null;
  onSubmit: (data: ExcavationSiteFormData) => Promise<void>;
  onCancel: () => void;
}

const initialEnvironmentalConditions: EnvironmentalConditions = {
  visibility: 80,
  currentStrength: 3,
  temperature: 18,
  depth: 25,
  sedimentType: "sandy",
  timeConstraints: 30,
};

const initialFormData: ExcavationSiteFormData = {
  name: "",
  location: "",
  historicalPeriod: "",
  description: "",
  gridWidth: 8,
  gridHeight: 8,
  difficulty: "beginner",
  environmentalConditions: initialEnvironmentalConditions,
  siteArtifacts: [],
};

export function ExcavationSiteForm({
  siteId,
  onSubmit,
  onCancel,
}: ExcavationSiteFormProps) {
  const [formData, setFormData] =
    useState<ExcavationSiteFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "basic" | "environment" | "artifacts"
  >("basic");

  const existingSite = useQuery(
    api.adminExcavationSites.getExcavationSiteForAdmin,
    siteId ? { siteId } : undefined
  );

  const availableArtifacts = useQuery(
    api.adminArtifacts.getAllArtifactsForAdmin,
    {
      includeInactive: false,
    }
  );

  useEffect(() => {
    if (existingSite) {
      setFormData({
        name: existingSite.name,
        location: existingSite.location,
        historicalPeriod: existingSite.historicalPeriod,
        description: existingSite.description,
        gridWidth: existingSite.gridWidth,
        gridHeight: existingSite.gridHeight,
        difficulty: existingSite.difficulty,
        environmentalConditions: existingSite.environmentalConditions,
        siteArtifacts: existingSite.siteArtifacts,
      });
    }
  }, [existingSite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBasicChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "gridWidth" || name === "gridHeight" ? parseInt(value) : value,
    }));
  };

  const handleEnvironmentalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      environmentalConditions: {
        ...prev.environmentalConditions,
        [name]: name === "sedimentType" ? value : parseFloat(value),
      },
    }));
  };

  const handleArtifactsChange = (artifacts: SiteArtifact[]) => {
    setFormData((prev) => ({
      ...prev,
      siteArtifacts: artifacts,
    }));
  };

  const tabs = [
    { id: "basic", name: "Basic Info", icon: "📝" },
    { id: "environment", name: "Environment", icon: "🌊" },
    { id: "artifacts", name: "Artifacts", icon: "🏺" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Basic Information Tab */}
      {activeTab === "basic" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Site Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleBasicChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleBasicChange}
                required
                placeholder="e.g., Mediterranean Sea, off Cyprus"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="historicalPeriod"
                className="block text-sm font-medium text-gray-700"
              >
                Historical Period *
              </label>
              <input
                type="text"
                id="historicalPeriod"
                name="historicalPeriod"
                value={formData.historicalPeriod}
                onChange={handleBasicChange}
                required
                placeholder="e.g., Classical Period"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-700"
              >
                Difficulty *
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleBasicChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="gridWidth"
                className="block text-sm font-medium text-gray-700"
              >
                Grid Width (3-20) *
              </label>
              <input
                type="number"
                id="gridWidth"
                name="gridWidth"
                value={formData.gridWidth}
                onChange={handleBasicChange}
                required
                min="3"
                max="20"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="gridHeight"
                className="block text-sm font-medium text-gray-700"
              >
                Grid Height (3-20) *
              </label>
              <input
                type="number"
                id="gridHeight"
                name="gridHeight"
                value={formData.gridHeight}
                onChange={handleBasicChange}
                required
                min="3"
                max="20"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleBasicChange}
              required
              rows={4}
              placeholder="Detailed description of the excavation site..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Environmental Conditions Tab */}
      {activeTab === "environment" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="visibility"
                className="block text-sm font-medium text-gray-700"
              >
                Visibility (0-100%) *
              </label>
              <input
                type="number"
                id="visibility"
                name="visibility"
                value={formData.environmentalConditions.visibility}
                onChange={handleEnvironmentalChange}
                required
                min="0"
                max="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="currentStrength"
                className="block text-sm font-medium text-gray-700"
              >
                Current Strength (0-10) *
              </label>
              <input
                type="number"
                id="currentStrength"
                name="currentStrength"
                value={formData.environmentalConditions.currentStrength}
                onChange={handleEnvironmentalChange}
                required
                min="0"
                max="10"
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="temperature"
                className="block text-sm font-medium text-gray-700"
              >
                Temperature (°C) *
              </label>
              <input
                type="number"
                id="temperature"
                name="temperature"
                value={formData.environmentalConditions.temperature}
                onChange={handleEnvironmentalChange}
                required
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="depth"
                className="block text-sm font-medium text-gray-700"
              >
                Depth (meters) *
              </label>
              <input
                type="number"
                id="depth"
                name="depth"
                value={formData.environmentalConditions.depth}
                onChange={handleEnvironmentalChange}
                required
                min="0"
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="sedimentType"
                className="block text-sm font-medium text-gray-700"
              >
                Sediment Type *
              </label>
              <select
                id="sedimentType"
                name="sedimentType"
                value={formData.environmentalConditions.sedimentType}
                onChange={handleEnvironmentalChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="sandy">Sandy</option>
                <option value="muddy">Muddy</option>
                <option value="rocky">Rocky</option>
                <option value="coral">Coral</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="timeConstraints"
                className="block text-sm font-medium text-gray-700"
              >
                Time Limit (minutes) *
              </label>
              <input
                type="number"
                id="timeConstraints"
                name="timeConstraints"
                value={formData.environmentalConditions.timeConstraints}
                onChange={handleEnvironmentalChange}
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Artifacts Tab */}
      {activeTab === "artifacts" && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Artifact Placement
            </h4>
            <p className="text-sm text-blue-700">
              Click on grid cells to place artifacts. You can adjust the depth
              and condition of each artifact.
            </p>
          </div>

          {availableArtifacts && (
            <ArtifactPlacementGrid
              gridWidth={formData.gridWidth}
              gridHeight={formData.gridHeight}
              artifacts={formData.siteArtifacts}
              availableArtifacts={availableArtifacts}
              onArtifactsChange={handleArtifactsChange}
            />
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving..." : siteId ? "Update Site" : "Create Site"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ArtifactFormData } from "./ArtifactManagement";
import { ImageUpload } from "./ImageUpload";
import { useFileUrl } from "@/hooks/useFileUrl";

interface ArtifactFormProps {
  artifactId?: Id<"gameArtifacts"> | null;
  onSubmit: (data: ArtifactFormData) => Promise<void>;
  onCancel: () => void;
}

const initialFormData: ArtifactFormData = {
  name: "",
  description: "",
  historicalPeriod: "",
  culture: "",
  dateRange: "",
  significance: "",
  imageUrl: "",
  imageStorageId: "",
  modelUrl: "",
  discoveryLocation: "",
  conservationNotes: "",
  difficulty: "beginner",
  category: "",
};

export function ArtifactForm({
  artifactId,
  onSubmit,
  onCancel,
}: ArtifactFormProps) {
  const [formData, setFormData] = useState<ArtifactFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingArtifact = useQuery(
    api.adminArtifacts.getArtifactForAdmin,
    artifactId ? { artifactId } : "skip"
  );

  // Get the current image URL from storage if we have a storage ID
  const currentImageUrl = useFileUrl(
    formData.imageStorageId
      ? (formData.imageStorageId as Id<"_storage">)
      : undefined
  );

  useEffect(() => {
    if (existingArtifact) {
      setFormData({
        name: existingArtifact.name,
        description: existingArtifact.description,
        historicalPeriod: existingArtifact.historicalPeriod,
        culture: existingArtifact.culture,
        dateRange: existingArtifact.dateRange,
        significance: existingArtifact.significance,
        imageUrl: existingArtifact.imageUrl,
        imageStorageId: existingArtifact.imageStorageId || "",
        modelUrl: existingArtifact.modelUrl || "",
        discoveryLocation: existingArtifact.discoveryLocation,
        conservationNotes: existingArtifact.conservationNotes,
        difficulty: existingArtifact.difficulty,
        category: existingArtifact.category,
      });
    }
  }, [existingArtifact]);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Clear storage ID if user enters a URL
      ...(name === "imageUrl" && value ? { imageStorageId: "" } : {}),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Basic Information</h4>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category *
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              placeholder="e.g., Pottery, Tools, Jewelry"
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
              onChange={handleChange}
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
              htmlFor="culture"
              className="block text-sm font-medium text-gray-700"
            >
              Culture *
            </label>
            <input
              type="text"
              id="culture"
              name="culture"
              value={formData.culture}
              onChange={handleChange}
              required
              placeholder="e.g., Ancient Greek, Roman"
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
              onChange={handleChange}
              required
              placeholder="e.g., Classical Period"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="dateRange"
              className="block text-sm font-medium text-gray-700"
            >
              Date Range
            </label>
            <input
              type="text"
              id="dateRange"
              name="dateRange"
              value={formData.dateRange}
              onChange={handleChange}
              placeholder="e.g., 5th century BCE"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Media and Location */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Media and Location</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Artifact Image *
            </label>
            <ImageUpload
              onImageUploaded={(storageId, url) => {
                setFormData((prev) => ({
                  ...prev,
                  imageStorageId: storageId,
                  imageUrl: "", // Clear URL when using storage
                }));
              }}
              currentImageUrl={currentImageUrl || formData.imageUrl}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium text-gray-700"
            >
              Or Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              You can either upload an image above or provide an image URL here
            </p>
          </div>

          <div>
            <label
              htmlFor="modelUrl"
              className="block text-sm font-medium text-gray-700"
            >
              3D Model URL
            </label>
            <input
              type="url"
              id="modelUrl"
              name="modelUrl"
              value={formData.modelUrl}
              onChange={handleChange}
              placeholder="https://example.com/model.glb"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="discoveryLocation"
              className="block text-sm font-medium text-gray-700"
            >
              Discovery Location *
            </label>
            <input
              type="text"
              id="discoveryLocation"
              name="discoveryLocation"
              value={formData.discoveryLocation}
              onChange={handleChange}
              required
              placeholder="e.g., Mediterranean Sea, off the coast of Greece"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Full-width fields */}
      <div className="space-y-4">
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
            onChange={handleChange}
            required
            rows={3}
            placeholder="Detailed description of the artifact..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="significance"
            className="block text-sm font-medium text-gray-700"
          >
            Historical Significance *
          </label>
          <textarea
            id="significance"
            name="significance"
            value={formData.significance}
            onChange={handleChange}
            required
            rows={3}
            placeholder="Why is this artifact historically significant?"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="conservationNotes"
            className="block text-sm font-medium text-gray-700"
          >
            Conservation Notes
          </label>
          <textarea
            id="conservationNotes"
            name="conservationNotes"
            value={formData.conservationNotes}
            onChange={handleChange}
            rows={2}
            placeholder="Notes about conservation status, restoration work, etc."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

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
          {isSubmitting
            ? "Saving..."
            : artifactId
              ? "Update Artifact"
              : "Create Artifact"}
        </button>
      </div>
    </form>
  );
}

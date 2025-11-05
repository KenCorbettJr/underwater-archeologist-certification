"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  ChallengeFormData,
  ChallengeCategory,
  ChallengeDifficulty,
} from "./ChallengeManagement";

interface ChallengeFormProps {
  challengeId?: Id<"challenges"> | null;
  onSubmit: (data: ChallengeFormData) => Promise<void>;
  onCancel: () => void;
}

const initialFormData: ChallengeFormData = {
  title: "",
  description: "",
  category: "artifacts",
  difficulty: "beginner",
  points: 10,
  content: "",
  requiredLevel: "beginner",
  order: 0,
};

const categories: { value: ChallengeCategory; label: string; icon: string }[] =
  [
    { value: "artifacts", label: "Artifacts", icon: "🏺" },
    { value: "techniques", label: "Techniques", icon: "🔧" },
    { value: "history", label: "History", icon: "📚" },
    { value: "conservation", label: "Conservation", icon: "🛡️" },
    { value: "fieldwork", label: "Fieldwork", icon: "⛏️" },
  ];

const difficulties: {
  value: ChallengeDifficulty;
  label: string;
  color: string;
}[] = [
  { value: "beginner", label: "Beginner", color: "text-green-600" },
  { value: "intermediate", label: "Intermediate", color: "text-yellow-600" },
  { value: "advanced", label: "Advanced", color: "text-red-600" },
];

export function ChallengeForm({
  challengeId,
  onSubmit,
  onCancel,
}: ChallengeFormProps) {
  const [formData, setFormData] = useState<ChallengeFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingChallenge = useQuery(
    api.adminChallenges.getChallengeForAdmin,
    challengeId ? { challengeId } : undefined
  );

  useEffect(() => {
    if (existingChallenge) {
      setFormData({
        title: existingChallenge.title,
        description: existingChallenge.description,
        category: existingChallenge.category,
        difficulty: existingChallenge.difficulty,
        points: existingChallenge.points,
        content: existingChallenge.content,
        requiredLevel: existingChallenge.requiredLevel,
        order: existingChallenge.order,
      });
    }
  }, [existingChallenge]);

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
      [name]:
        name === "points" || name === "order" ? parseInt(value) || 0 : value,
    }));
  };

  // Validate required level doesn't exceed difficulty
  const getValidRequiredLevels = () => {
    const difficultyIndex = difficulties.findIndex(
      (d) => d.value === formData.difficulty
    );
    return difficulties.slice(0, difficultyIndex + 1);
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
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Challenge Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
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
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
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
              {difficulties.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="requiredLevel"
              className="block text-sm font-medium text-gray-700"
            >
              Required Level *
            </label>
            <select
              id="requiredLevel"
              name="requiredLevel"
              value={formData.requiredLevel}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {getValidRequiredLevels().map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Minimum level required to access this challenge
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Settings</h4>

          <div>
            <label
              htmlFor="points"
              className="block text-sm font-medium text-gray-700"
            >
              Points *
            </label>
            <input
              type="number"
              id="points"
              name="points"
              value={formData.points}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Points awarded for completing this challenge
            </p>
          </div>

          <div>
            <label
              htmlFor="order"
              className="block text-sm font-medium text-gray-700"
            >
              Order *
            </label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleChange}
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Display order within category and difficulty (0 = first)
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Preview</h5>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <span>
                  {categories.find((c) => c.value === formData.category)?.icon}
                </span>
                <span className="font-medium">{formData.category}</span>
              </div>
              <div
                className={`font-medium ${difficulties.find((d) => d.value === formData.difficulty)?.color}`}
              >
                {formData.difficulty}
              </div>
              <div className="text-gray-600">
                {formData.points} points • Order {formData.order}
              </div>
            </div>
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
            placeholder="Brief description of what this challenge covers..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700"
          >
            Challenge Content *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={8}
            placeholder="Detailed challenge content, instructions, and learning materials..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            You can use markdown formatting for rich content
          </p>
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
            : challengeId
              ? "Update Challenge"
              : "Create Challenge"}
        </button>
      </div>
    </form>
  );
}

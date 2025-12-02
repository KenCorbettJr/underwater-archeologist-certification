"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface BulkImportModalProps {
  type: "artifacts" | "sites";
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportModal({
  type,
  onClose,
  onSuccess,
}: BulkImportModalProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const bulkImportArtifacts = useMutation(
    api.adminArtifacts.bulkImportArtifacts
  );
  const bulkImportSites = useMutation(api.adminExcavationSites.bulkImportSites);

  const handleImport = async () => {
    setError(null);
    setIsImporting(true);
    setSuccessCount(0);

    try {
      const data = JSON.parse(jsonInput);

      if (!Array.isArray(data)) {
        throw new Error("Input must be a JSON array");
      }

      if (type === "artifacts") {
        const result = await bulkImportArtifacts({ items: data });
        setSuccessCount(result.successCount);
      } else {
        const result = await bulkImportSites({ items: data });
        setSuccessCount(result.successCount);
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to import data");
    } finally {
      setIsImporting(false);
    }
  };

  const exampleData =
    type === "artifacts"
      ? `[
  {
    "name": "Ancient Amphora",
    "description": "A well-preserved ceramic vessel",
    "historicalPeriod": "Ancient Greece",
    "culture": "Greek",
    "dateRange": "500-400 BCE",
    "significance": "Used for storing wine and oil",
    "imageUrl": "https://example.com/amphora.jpg",
    "discoveryLocation": "Mediterranean Sea",
    "conservationNotes": "Requires careful cleaning",
    "difficulty": "beginner",
    "category": "Pottery"
  }
]`
      : `[
  {
    "name": "Sunken Harbor",
    "location": "Mediterranean Coast",
    "historicalPeriod": "Roman Empire",
    "description": "Ancient Roman harbor site",
    "gridWidth": 10,
    "gridHeight": 10,
    "difficulty": "intermediate",
    "environmentalConditions": {
      "visibility": 70,
      "currentStrength": 3,
      "temperature": 18,
      "depth": 15,
      "sedimentType": "sand",
      "timeConstraints": 30
    },
    "siteArtifacts": []
  }
]`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Bulk Import {type === "artifacts" ? "Artifacts" : "Sites"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JSON Data
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder={`Paste your JSON array here...`}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {successCount > 0 && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Successfully imported {successCount} {type}!
              </div>
            )}

            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium text-gray-700">
                Show Example Format
              </summary>
              <pre className="mt-3 text-xs overflow-x-auto bg-white p-3 rounded border border-gray-200">
                {exampleData}
              </pre>
            </details>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || !jsonInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isImporting ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

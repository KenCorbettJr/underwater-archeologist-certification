"use client";

import { useState } from "react";
import { SiteArtifact } from "./ExcavationSiteManagement";
import { Id } from "../../../convex/_generated/dataModel";

interface Artifact {
  _id: Id<"gameArtifacts">;
  name: string;
  imageUrl: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface ArtifactPlacementGridProps {
  gridWidth: number;
  gridHeight: number;
  artifacts: SiteArtifact[];
  availableArtifacts: Artifact[];
  onArtifactsChange: (artifacts: SiteArtifact[]) => void;
}

export function ArtifactPlacementGrid({
  gridWidth,
  gridHeight,
  artifacts,
  availableArtifacts,
  onArtifactsChange,
}: ArtifactPlacementGridProps) {
  const [selectedArtifactId, setSelectedArtifactId] =
    useState<Id<"gameArtifacts"> | null>(null);
  const [showArtifactSelector, setShowArtifactSelector] = useState(false);

  // Create a map of grid positions to artifacts
  const artifactMap = new Map<string, SiteArtifact>();
  artifacts.forEach((artifact) => {
    const key = `${artifact.gridPosition.x},${artifact.gridPosition.y}`;
    artifactMap.set(key, artifact);
  });

  const handleCellClick = (x: number, y: number) => {
    const key = `${x},${y}`;
    const existingArtifact = artifactMap.get(key);

    if (existingArtifact) {
      // Remove existing artifact
      const updatedArtifacts = artifacts.filter(
        (a) => !(a.gridPosition.x === x && a.gridPosition.y === y)
      );
      onArtifactsChange(updatedArtifacts);
    } else if (selectedArtifactId) {
      // Add new artifact
      const newArtifact: SiteArtifact = {
        artifactId: selectedArtifactId,
        gridPosition: { x, y },
        depth: 0.5,
        isDiscovered: false,
        condition: "good",
      };
      onArtifactsChange([...artifacts, newArtifact]);
    }
  };

  const handleArtifactUpdate = (
    x: number,
    y: number,
    updates: Partial<Omit<SiteArtifact, "artifactId" | "gridPosition">>
  ) => {
    const updatedArtifacts = artifacts.map((artifact) => {
      if (artifact.gridPosition.x === x && artifact.gridPosition.y === y) {
        return { ...artifact, ...updates };
      }
      return artifact;
    });
    onArtifactsChange(updatedArtifacts);
  };

  const getArtifactInfo = (artifactId: Id<"gameArtifacts">) => {
    return availableArtifacts.find((a) => a._id === artifactId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "border-green-400 bg-green-50";
      case "intermediate":
        return "border-yellow-400 bg-yellow-50";
      case "advanced":
        return "border-red-400 bg-red-50";
      default:
        return "border-gray-400 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Artifact Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            Select Artifact to Place
          </h4>
          <button
            type="button"
            onClick={() => setShowArtifactSelector(!showArtifactSelector)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showArtifactSelector ? "Hide" : "Show"} Available Artifacts
          </button>
        </div>

        {showArtifactSelector && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
            {availableArtifacts.map((artifact) => (
              <button
                key={artifact._id}
                type="button"
                onClick={() => {
                  setSelectedArtifactId(artifact._id);
                  setShowArtifactSelector(false);
                }}
                className={`p-3 border-2 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  selectedArtifactId === artifact._id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <img
                  src={artifact.imageUrl}
                  alt={artifact.name}
                  className="w-full h-16 object-cover rounded mb-2"
                />
                <div className="text-xs font-medium truncate">
                  {artifact.name}
                </div>
                <div className="text-xs text-gray-500">{artifact.category}</div>
              </button>
            ))}
          </div>
        )}

        {selectedArtifactId && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-900">
              Selected: {getArtifactInfo(selectedArtifactId)?.name}
            </div>
            <div className="text-xs text-blue-700">
              Click on empty grid cells to place this artifact
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">
          Excavation Grid ({gridWidth} × {gridHeight})
        </h4>

        <div
          className="inline-block border-2 border-gray-300 rounded-lg overflow-hidden"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
            gap: "1px",
            backgroundColor: "#e5e7eb",
          }}
        >
          {Array.from({ length: gridHeight }, (_, y) =>
            Array.from({ length: gridWidth }, (_, x) => {
              const key = `${x},${y}`;
              const artifact = artifactMap.get(key);
              const artifactInfo = artifact
                ? getArtifactInfo(artifact.artifactId)
                : null;

              return (
                <div
                  key={key}
                  className={`w-12 h-12 border cursor-pointer transition-colors ${
                    artifact
                      ? artifactInfo
                        ? getDifficultyColor(artifactInfo.difficulty)
                        : "border-gray-400 bg-gray-100"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => handleCellClick(x, y)}
                  title={
                    artifact && artifactInfo
                      ? `${artifactInfo.name} (${x}, ${y})`
                      : `Empty cell (${x}, ${y})`
                  }
                >
                  {artifact && artifactInfo && (
                    <img
                      src={artifactInfo.imageUrl}
                      alt={artifactInfo.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="text-xs text-gray-500">
          Click on cells to place/remove artifacts. Colored borders indicate
          difficulty levels.
        </div>
      </div>

      {/* Placed Artifacts List */}
      {artifacts.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            Placed Artifacts ({artifacts.length})
          </h4>
          <div className="space-y-3">
            {artifacts.map((artifact, index) => {
              const artifactInfo = getArtifactInfo(artifact.artifactId);
              if (!artifactInfo) return null;

              return (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <img
                      src={artifactInfo.imageUrl}
                      alt={artifactInfo.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="font-medium">{artifactInfo.name}</div>
                        <div className="text-sm text-gray-500">
                          Position: ({artifact.gridPosition.x},{" "}
                          {artifact.gridPosition.y})
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Depth (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={artifact.depth}
                            onChange={(e) =>
                              handleArtifactUpdate(
                                artifact.gridPosition.x,
                                artifact.gridPosition.y,
                                { depth: parseFloat(e.target.value) }
                              )
                            }
                            className="mt-1 block w-full text-sm rounded border-gray-300"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Condition
                          </label>
                          <select
                            value={artifact.condition}
                            onChange={(e) =>
                              handleArtifactUpdate(
                                artifact.gridPosition.x,
                                artifact.gridPosition.y,
                                { condition: e.target.value as any }
                              )
                            }
                            className="mt-1 block w-full text-sm rounded border-gray-300"
                          >
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

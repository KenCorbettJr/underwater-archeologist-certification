"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Artifact } from "@/types";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ArtifactGalleryProps {
  artifacts: Artifact[];
  selectedArtifact?: Artifact | null;
  onArtifactSelect: (artifact: Artifact) => void;
  className?: string;
}

export function ArtifactGallery({
  artifacts,
  selectedArtifact,
  onArtifactSelect,
  className = "",
}: ArtifactGalleryProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className={`artifact-gallery ${className}`}>
      {/* Gallery Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Artifact Gallery ({artifacts.length} items)
        </h3>

        {selectedArtifact && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetView}>
              Reset
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Artifact Grid */}
        <div className="artifact-grid">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2 border rounded-lg bg-gray-50">
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className={`
                  artifact-item cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-md
                  ${
                    selectedArtifact?.id === artifact.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }
                `}
                onClick={() => onArtifactSelect(artifact)}
              >
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  <Image
                    src={artifact.imageUrl}
                    alt={artifact.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
                <div className="p-2">
                  <h4 className="text-sm font-medium text-gray-800 truncate">
                    {artifact.name}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">
                    {artifact.historicalPeriod}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className={`
                      text-xs px-2 py-1 rounded-full
                      ${
                        artifact.difficulty === "beginner"
                          ? "bg-green-100 text-green-800"
                          : artifact.difficulty === "intermediate"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }
                    `}
                    >
                      {artifact.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed View */}
        <div className="artifact-detail">
          {selectedArtifact ? (
            <div className="border rounded-lg bg-white p-4">
              <div className="aspect-square relative overflow-hidden rounded-lg mb-4 bg-gray-100">
                <Image
                  src={selectedArtifact.imageUrl}
                  alt={selectedArtifact.name}
                  fill
                  className="object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-800">
                  {selectedArtifact.name}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Period:</span>
                    <p className="text-gray-800">
                      {selectedArtifact.historicalPeriod}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Culture:</span>
                    <p className="text-gray-800">{selectedArtifact.culture}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Date Range:
                    </span>
                    <p className="text-gray-800">
                      {selectedArtifact.dateRange}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Category:</span>
                    <p className="text-gray-800">{selectedArtifact.category}</p>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Location:</span>
                  <p className="text-gray-800 text-sm">
                    {selectedArtifact.discoveryLocation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
                Select an artifact to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

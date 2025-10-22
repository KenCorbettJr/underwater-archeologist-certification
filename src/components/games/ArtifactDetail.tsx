"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Artifact } from "@/types";
import { Button } from "@/components/ui/button";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  BookOpen,
  MapPin,
  Calendar,
  Users,
  Tag,
  Info,
} from "lucide-react";

interface ArtifactDetailProps {
  artifact: Artifact;
  isOpen: boolean;
  onClose: () => void;
  showEducationalContent?: boolean;
  className?: string;
}

export function ArtifactDetail({
  artifact,
  isOpen,
  onClose,
  showEducationalContent = true,
  className = "",
}: ArtifactDetailProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "overview" | "details" | "conservation"
  >("overview");

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artifact.name,
          text: artifact.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownload = () => {
    // Create a link to download the image
    const link = document.createElement("a");
    link.href = artifact.imageUrl;
    link.download = `${artifact.name.replace(/\s+/g, "_")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`artifact-detail-modal ${className}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-4 md:inset-8 bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">{artifact.name}</h2>
            <span
              className={`
              px-2 py-1 rounded-full text-xs font-medium
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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Image Panel */}
          <div className="flex-1 flex flex-col bg-gray-100">
            {/* Image Controls */}
            <div className="flex items-center justify-between p-3 bg-white border-b">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetView}>
                  Reset
                </Button>
              </div>
            </div>

            {/* Image Display */}
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="relative transition-transform duration-200 cursor-move"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                >
                  <Image
                    src={artifact.imageUrl}
                    alt={artifact.name}
                    width={600}
                    height={600}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Information Panel */}
          <div className="w-96 flex flex-col bg-white border-l">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "overview"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                <Info className="w-4 h-4 inline mr-1" />
                Overview
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "details"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("details")}
              >
                <BookOpen className="w-4 h-4 inline mr-1" />
                Details
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "conservation"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("conservation")}
              >
                Conservation
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {artifact.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Period
                        </span>
                        <p className="text-sm text-gray-800">
                          {artifact.historicalPeriod}
                        </p>
                        <p className="text-xs text-gray-600">
                          {artifact.dateRange}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Culture
                        </span>
                        <p className="text-sm text-gray-800">
                          {artifact.culture}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Discovery Location
                        </span>
                        <p className="text-sm text-gray-800">
                          {artifact.discoveryLocation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Tag className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Category
                        </span>
                        <p className="text-sm text-gray-800">
                          {artifact.category}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "details" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Historical Significance
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {artifact.significance}
                    </p>
                  </div>

                  {showEducationalContent && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Educational Context
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-sm">
                          This artifact represents important archaeological
                          evidence from the {artifact.historicalPeriod} period.
                          It provides insights into the daily life, technology,
                          and cultural practices of the {artifact.culture}{" "}
                          civilization.
                        </p>
                      </div>
                    </div>
                  )}

                  {artifact.modelUrl && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        3D Model
                      </h3>
                      <div className="bg-gray-100 border rounded-lg p-4 text-center">
                        <p className="text-gray-600 text-sm mb-2">
                          3D model available
                        </p>
                        <Button variant="outline" size="sm">
                          View 3D Model
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "conservation" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Conservation Notes
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {artifact.conservationNotes}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Preservation Status
                    </h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 text-sm">
                        This artifact has been properly conserved and is in
                        stable condition for study and display.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Conservation Techniques
                    </h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Careful cleaning and stabilization</li>
                      <li>• Environmental monitoring</li>
                      <li>• Preventive conservation measures</li>
                      <li>• Documentation and photography</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

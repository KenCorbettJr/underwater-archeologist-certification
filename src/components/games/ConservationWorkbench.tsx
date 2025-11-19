"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Damage {
  id: string;
  type:
    | "corrosion"
    | "fracture"
    | "encrustation"
    | "biological"
    | "deterioration";
  severity: "minor" | "moderate" | "severe";
  location: string;
  description: string;
}

interface ArtifactCondition {
  overallCondition: "excellent" | "good" | "fair" | "poor";
  damages: Damage[];
  environmentalFactors: string[];
  materialType: string;
  ageEstimate: string;
}

interface ConservationWorkbenchProps {
  artifactName: string;
  artifactImage: string;
  condition: ArtifactCondition;
  onAssessmentComplete: (identifiedDamages: string[]) => void;
  assessmentComplete: boolean;
}

export function ConservationWorkbench({
  artifactName,
  artifactImage,
  condition,
  onAssessmentComplete,
  assessmentComplete,
}: ConservationWorkbenchProps) {
  const [selectedDamages, setSelectedDamages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"visual" | "details">("visual");

  const damageTypes = [
    { id: "corrosion", label: "Corrosion", icon: "🦠" },
    { id: "fracture", label: "Fracture", icon: "💔" },
    { id: "encrustation", label: "Encrustation", icon: "🪨" },
    { id: "biological", label: "Biological Growth", icon: "🌿" },
    { id: "deterioration", label: "Deterioration", icon: "⚠️" },
  ];

  const toggleDamage = (damageId: string) => {
    if (selectedDamages.includes(damageId)) {
      setSelectedDamages(selectedDamages.filter((id) => id !== damageId));
    } else {
      setSelectedDamages([...selectedDamages, damageId]);
    }
  };

  const handleSubmitAssessment = () => {
    onAssessmentComplete(selectedDamages);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe":
        return "text-red-400 bg-red-500/20";
      case "moderate":
        return "text-yellow-400 bg-yellow-500/20";
      case "minor":
        return "text-blue-400 bg-blue-500/20";
      default:
        return "text-white/60 bg-white/10";
    }
  };

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          onClick={() => setViewMode("visual")}
          className={viewMode === "visual" ? "bg-ocean-600" : "bg-ocean-400"}
        >
          👁️ Visual Inspection
        </Button>
        <Button
          onClick={() => setViewMode("details")}
          className={viewMode === "details" ? "bg-ocean-600" : "bg-ocean-400"}
        >
          📋 Detailed Analysis
        </Button>
      </div>

      {/* Artifact Display */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
        <h3 className="text-white font-bold text-xl mb-4">{artifactName}</h3>

        {viewMode === "visual" && (
          <div className="space-y-4">
            {/* Artifact Image */}
            <div className="bg-white/5 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="text-8xl mb-4">🏺</div>
                <p className="text-white/60 text-sm">
                  Artifact under examination
                </p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/5 rounded p-3">
                <p className="text-white/60 mb-1">Material</p>
                <p className="text-white font-semibold">
                  {condition.materialType}
                </p>
              </div>
              <div className="bg-white/5 rounded p-3">
                <p className="text-white/60 mb-1">Age Estimate</p>
                <p className="text-white font-semibold">
                  {condition.ageEstimate}
                </p>
              </div>
              <div className="bg-white/5 rounded p-3">
                <p className="text-white/60 mb-1">Overall Condition</p>
                <p className="text-white font-semibold capitalize">
                  {condition.overallCondition}
                </p>
              </div>
              <div className="bg-white/5 rounded p-3">
                <p className="text-white/60 mb-1">Damages Found</p>
                <p className="text-white font-semibold">
                  {condition.damages.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {viewMode === "details" && (
          <div className="space-y-4">
            {/* Environmental Factors */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">
                Environmental Exposure:
              </h4>
              <div className="flex flex-wrap gap-2">
                {condition.environmentalFactors.map((factor, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-ocean-600/30 text-ocean-200 rounded-full text-sm"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>

            {/* Damage Assessment (if complete) */}
            {assessmentComplete && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">
                  Identified Damages:
                </h4>
                <div className="space-y-2">
                  {condition.damages.map((damage) => (
                    <div
                      key={damage.id}
                      className={`p-3 rounded-lg ${getSeverityColor(damage.severity)}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold capitalize">
                          {damage.type}
                        </span>
                        <span className="text-xs capitalize">
                          {damage.severity}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{damage.description}</p>
                      <p className="text-xs mt-1 opacity-75">
                        Location: {damage.location}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Damage Identification (if not complete) */}
      {!assessmentComplete && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">
            Identify Damage Types Present:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {damageTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleDamage(type.id)}
                className={`
                  p-3 rounded-lg text-sm font-medium transition-all border-2
                  ${
                    selectedDamages.includes(type.id)
                      ? "bg-sand-400/30 border-sand-400 text-white"
                      : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
                  }
                `}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                {type.label}
              </button>
            ))}
          </div>

          <Button
            onClick={handleSubmitAssessment}
            disabled={selectedDamages.length === 0}
            className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900 disabled:opacity-50"
          >
            Submit Assessment
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-ocean-900/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">💡 Assessment Tips:</h4>
        <ul className="text-white/80 text-sm space-y-1">
          <li>• Examine the artifact carefully in both view modes</li>
          <li>• Consider environmental factors that may have caused damage</li>
          <li>• Identify all visible types of damage</li>
          <li>• Note the severity and location of each damage type</li>
        </ul>
      </div>
    </div>
  );
}

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
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Create damage options from actual damages in the condition
  const damageOptions = condition.damages.map((damage) => ({
    id: damage.id,
    type: damage.type,
    label: damage.type.charAt(0).toUpperCase() + damage.type.slice(1),
    icon:
      damage.type === "corrosion"
        ? "🦠"
        : damage.type === "fracture"
          ? "💔"
          : damage.type === "encrustation"
            ? "🪨"
            : damage.type === "biological"
              ? "🌿"
              : "⚠️",
  }));

  const toggleDamage = (damageId: string) => {
    setShowFeedback(false);
    if (selectedDamages.includes(damageId)) {
      setSelectedDamages(selectedDamages.filter((id) => id !== damageId));
    } else {
      setSelectedDamages([...selectedDamages, damageId]);
    }
  };

  const handleSubmitAssessment = () => {
    // Check if all damages are correctly identified
    const allDamageIds = condition.damages.map((d) => d.id);
    const correctCount = selectedDamages.filter((id) =>
      allDamageIds.includes(id)
    ).length;
    const accuracy = correctCount / allDamageIds.length;

    // Only proceed if accuracy is high enough (at least 80%)
    if (accuracy >= 0.8) {
      setShowFeedback(false);
      onAssessmentComplete(selectedDamages);
    } else {
      // Show feedback and let them try again
      const missedDamages = allDamageIds.filter(
        (id) => !selectedDamages.includes(id)
      );
      const incorrectSelections = selectedDamages.filter(
        (id) => !allDamageIds.includes(id)
      );

      let message = "Not quite right. ";
      if (missedDamages.length > 0) {
        message += `You missed ${missedDamages.length} damage type(s). `;
      }
      if (incorrectSelections.length > 0) {
        message += `You selected ${incorrectSelections.length} incorrect damage type(s). `;
      }
      message += "Look more carefully and try again!";

      setFeedbackMessage(message);
      setShowFeedback(true);
    }
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
            {/* Artifact Image with Damage Overlay */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-lg p-8 flex items-center justify-center min-h-[400px] relative overflow-hidden">
              {/* Artifact Display */}
              <div className="relative">
                {/* Main artifact image with realistic styling */}
                {artifactImage ? (
                  <div className="relative">
                    <img
                      src={artifactImage}
                      alt={artifactName}
                      className="max-w-md max-h-[350px] object-contain rounded-lg"
                      style={{
                        filter: assessmentComplete
                          ? "brightness(1.1) contrast(1.05)"
                          : "brightness(0.7) contrast(0.9) saturate(0.6)",
                      }}
                    />
                    {/* Damage overlays - only show before assessment */}
                    {!assessmentComplete && (
                      <>
                        {/* Encrustation overlay */}
                        {condition.damages.some(
                          (d) => d.type === "encrustation"
                        ) && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                "radial-gradient(circle at 30% 40%, rgba(139, 115, 85, 0.6) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(101, 84, 63, 0.5) 0%, transparent 35%)",
                              mixBlendMode: "multiply",
                            }}
                          />
                        )}
                        {/* Corrosion overlay */}
                        {condition.damages.some(
                          (d) => d.type === "corrosion"
                        ) && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                "radial-gradient(circle at 20% 70%, rgba(120, 81, 45, 0.5) 0%, transparent 30%), radial-gradient(circle at 80% 30%, rgba(139, 90, 43, 0.4) 0%, transparent 25%)",
                              mixBlendMode: "overlay",
                            }}
                          />
                        )}
                        {/* Biological growth overlay */}
                        {condition.damages.some(
                          (d) => d.type === "biological"
                        ) && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                "radial-gradient(circle at 50% 80%, rgba(34, 139, 34, 0.4) 0%, transparent 40%), radial-gradient(circle at 40% 20%, rgba(46, 125, 50, 0.3) 0%, transparent 30%)",
                              mixBlendMode: "darken",
                            }}
                          />
                        )}
                        {/* Dirt and sediment overlay */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(180deg, transparent 0%, rgba(62, 39, 35, 0.3) 100%)",
                            mixBlendMode: "multiply",
                          }}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-9xl mb-4 opacity-60">🏺</div>
                    <p className="text-white/60 text-sm">
                      Artifact under examination
                    </p>
                  </div>
                )}

                {/* Assessment status badge */}
                {assessmentComplete && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ✓ Assessed
                  </div>
                )}
              </div>

              {/* Examination lighting effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)",
                }}
              />
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

          {/* Feedback message */}
          {showFeedback && (
            <div className="mb-4 p-3 bg-yellow-500/20 border-2 border-yellow-400 rounded-lg">
              <p className="text-yellow-200 text-sm">{feedbackMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {damageOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleDamage(option.id)}
                className={`
                  p-3 rounded-lg text-sm font-medium transition-all border-2
                  ${
                    selectedDamages.includes(option.id)
                      ? "bg-sand-400/30 border-sand-400 text-white"
                      : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
                  }
                `}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                {option.label}
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

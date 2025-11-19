"use client";

import React from "react";
import { ExcavationGameData, SiteArtifact } from "../../types";

interface ProgressIndicatorProps {
  gameData: ExcavationGameData;
  siteArtifacts: SiteArtifact[];
  siteName: string;
  timeLimit: number; // in minutes
}

export default function ProgressIndicator({
  gameData,
  siteArtifacts,
  siteName,
  timeLimit,
}: ProgressIndicatorProps) {
  // Calculate progress metrics
  const totalCells = gameData.excavatedCells.length;
  const excavatedCells = gameData.excavatedCells.filter(
    (cell) => cell.excavated
  ).length;
  const excavationProgress =
    totalCells > 0 ? (excavatedCells / totalCells) * 100 : 0;

  const totalArtifacts = siteArtifacts.length;
  const discoveredArtifacts = gameData.discoveredArtifacts.length;
  const artifactProgress =
    totalArtifacts > 0 ? (discoveredArtifacts / totalArtifacts) * 100 : 0;

  const requiredDocs = gameData.documentationEntries.filter(
    (e) => e.isRequired
  );
  const completedDocs = requiredDocs.filter((e) => e.isComplete);
  const documentationProgress =
    requiredDocs.length > 0
      ? (completedDocs.length / requiredDocs.length) * 100
      : 0;

  // Time calculations
  const totalTimeSeconds = timeLimit * 60;
  const elapsedSeconds = totalTimeSeconds - gameData.timeRemaining;
  const timeProgress = (elapsedSeconds / totalTimeSeconds) * 100;
  const minutesRemaining = Math.floor(gameData.timeRemaining / 60);
  const secondsRemaining = gameData.timeRemaining % 60;

  // Overall completion
  const overallProgress =
    (excavationProgress + artifactProgress + documentationProgress) / 3;

  // Protocol compliance
  const totalViolations = gameData.protocolViolations.length;
  const severeViolations = gameData.protocolViolations.filter(
    (v) => v.severity === "severe"
  ).length;
  const complianceScore = Math.max(
    0,
    100 - totalViolations * 5 - severeViolations * 15
  );

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    if (progress >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTimeColor = (): string => {
    if (gameData.timeRemaining > totalTimeSeconds * 0.5)
      return "text-green-600";
    if (gameData.timeRemaining > totalTimeSeconds * 0.25)
      return "text-yellow-600";
    return "text-red-600";
  };

  const getComplianceColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <h3 className="text-base font-semibold flex items-center gap-2 text-white">
        📊 Progress
      </h3>

      {/* Time remaining */}
      <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-white">Time Remaining</span>
          <span className={`text-base font-bold ${getTimeColor()}`}>
            {minutesRemaining}:{secondsRemaining.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-1000 ${
              gameData.timeRemaining < totalTimeSeconds * 0.25
                ? "bg-red-500"
                : "bg-sand-400"
            }`}
            style={{ width: `${Math.max(0, 100 - timeProgress)}%` }}
          />
        </div>
      </div>

      {/* Overall progress */}
      <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-white">
            Overall Completion
          </span>
          <span className="text-base font-bold text-sand-300">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(overallProgress)}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Detailed progress metrics */}
      <div className="grid grid-cols-3 gap-2">
        {/* Excavation progress */}
        <div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <div className="text-xl mb-0.5">🏗️</div>
          <div className="text-xs font-medium text-white mb-0.5">
            Excavation
          </div>
          <div className="text-sm font-bold text-sand-300">
            {Math.round(excavationProgress)}%
          </div>
          <div className="text-xs text-ocean-100">
            {excavatedCells}/{totalCells}
          </div>
          <div className="w-full bg-white/20 rounded-full h-1 mt-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(excavationProgress)}`}
              style={{ width: `${excavationProgress}%` }}
            />
          </div>
        </div>

        {/* Artifact discovery */}
        <div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <div className="text-xl mb-0.5">🏺</div>
          <div className="text-xs font-medium text-white mb-0.5">Artifacts</div>
          <div className="text-sm font-bold text-sand-300">
            {Math.round(artifactProgress)}%
          </div>
          <div className="text-xs text-ocean-100">
            {discoveredArtifacts}/{totalArtifacts}
          </div>
          <div className="w-full bg-white/20 rounded-full h-1 mt-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(artifactProgress)}`}
              style={{ width: `${artifactProgress}%` }}
            />
          </div>
        </div>

        {/* Documentation */}
        <div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <div className="text-xl mb-0.5">📋</div>
          <div className="text-xs font-medium text-white mb-0.5">Docs</div>
          <div className="text-sm font-bold text-sand-300">
            {Math.round(documentationProgress)}%
          </div>
          <div className="text-xs text-ocean-100">
            {completedDocs.length}/{requiredDocs.length}
          </div>
          <div className="w-full bg-white/20 rounded-full h-1 mt-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(documentationProgress)}`}
              style={{ width: `${documentationProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Protocol compliance */}
      <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-white">
            Protocol Compliance
          </span>
          <span
            className={`text-sm font-bold ${getComplianceColor(complianceScore)}`}
          >
            {Math.round(complianceScore)}%
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(complianceScore)}`}
            style={{ width: `${complianceScore}%` }}
          />
        </div>
        {totalViolations > 0 && (
          <div className="mt-1 text-xs text-red-300">
            {totalViolations} violation{totalViolations !== 1 ? "s" : ""}
            {severeViolations > 0 && ` (${severeViolations} severe)`}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1 text-ocean-100">
          <div className="flex justify-between">
            <span>Docs:</span>
            <span className="font-medium text-white">
              {gameData.documentationEntries.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Violations:</span>
            <span className="font-medium text-white">{totalViolations}</span>
          </div>
        </div>
        <div className="space-y-1 text-ocean-100">
          <div className="flex justify-between">
            <span>Excavated:</span>
            <span className="font-medium text-white">{excavatedCells}</span>
          </div>
          <div className="flex justify-between">
            <span>Found:</span>
            <span className="font-medium text-white">
              {discoveredArtifacts}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

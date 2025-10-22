"use client";

import React from 'react';
import { ExcavationGameData, SiteArtifact } from '../../types';

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
  timeLimit
}: ProgressIndicatorProps) {
  
  // Calculate progress metrics
  const totalCells = gameData.excavatedCells.length;
  const excavatedCells = gameData.excavatedCells.filter(cell => cell.excavated).length;
  const excavationProgress = totalCells > 0 ? (excavatedCells / totalCells) * 100 : 0;

  const totalArtifacts = siteArtifacts.length;
  const discoveredArtifacts = gameData.discoveredArtifacts.length;
  const artifactProgress = totalArtifacts > 0 ? (discoveredArtifacts / totalArtifacts) * 100 : 0;

  const requiredDocs = gameData.documentationEntries.filter(e => e.isRequired);
  const completedDocs = requiredDocs.filter(e => e.isComplete);
  const documentationProgress = requiredDocs.length > 0 ? (completedDocs.length / requiredDocs.length) * 100 : 0;

  // Time calculations
  const totalTimeSeconds = timeLimit * 60;
  const elapsedSeconds = totalTimeSeconds - gameData.timeRemaining;
  const timeProgress = (elapsedSeconds / totalTimeSeconds) * 100;
  const minutesRemaining = Math.floor(gameData.timeRemaining / 60);
  const secondsRemaining = gameData.timeRemaining % 60;

  // Overall completion
  const overallProgress = (excavationProgress + artifactProgress + documentationProgress) / 3;

  // Protocol compliance
  const totalViolations = gameData.protocolViolations.length;
  const severeViolations = gameData.protocolViolations.filter(v => v.severity === 'severe').length;
  const complianceScore = Math.max(0, 100 - (totalViolations * 5) - (severeViolations * 15));

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    if (progress >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTimeColor = (): string => {
    if (gameData.timeRemaining > totalTimeSeconds * 0.5) return "text-green-600";
    if (gameData.timeRemaining > totalTimeSeconds * 0.25) return "text-yellow-600";
    return "text-red-600";
  };

  const getComplianceColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📊 Excavation Progress
        </h3>
        <div className="text-sm text-gray-600">
          {siteName}
        </div>
      </div>

      {/* Time remaining */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Time Remaining</span>
          <span className={`text-lg font-bold ${getTimeColor()}`}>
            {minutesRemaining}:{secondsRemaining.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              gameData.timeRemaining < totalTimeSeconds * 0.25 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.max(0, 100 - timeProgress)}%` }}
          />
        </div>
      </div>

      {/* Overall progress */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Completion</span>
          <span className="text-lg font-bold text-blue-600">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(overallProgress)}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Detailed progress metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Excavation progress */}
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <div className="text-2xl mb-1">🏗️</div>
          <div className="text-sm font-medium text-gray-700">Site Excavation</div>
          <div className="text-lg font-bold text-amber-600">
            {Math.round(excavationProgress)}%
          </div>
          <div className="text-xs text-gray-600">
            {excavatedCells}/{totalCells} cells
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(excavationProgress)}`}
              style={{ width: `${excavationProgress}%` }}
            />
          </div>
        </div>

        {/* Artifact discovery */}
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl mb-1">🏺</div>
          <div className="text-sm font-medium text-gray-700">Artifacts Found</div>
          <div className="text-lg font-bold text-yellow-600">
            {Math.round(artifactProgress)}%
          </div>
          <div className="text-xs text-gray-600">
            {discoveredArtifacts}/{totalArtifacts} artifacts
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(artifactProgress)}`}
              style={{ width: `${artifactProgress}%` }}
            />
          </div>
        </div>

        {/* Documentation */}
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-sm font-medium text-gray-700">Documentation</div>
          <div className="text-lg font-bold text-green-600">
            {Math.round(documentationProgress)}%
          </div>
          <div className="text-xs text-gray-600">
            {completedDocs.length}/{requiredDocs.length} required
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(documentationProgress)}`}
              style={{ width: `${documentationProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Protocol compliance */}
      <div className="p-3 bg-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Protocol Compliance</span>
          <span className={`text-lg font-bold ${getComplianceColor(complianceScore)}`}>
            {Math.round(complianceScore)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(complianceScore)}`}
            style={{ width: `${complianceScore}%` }}
          />
        </div>
        {totalViolations > 0 && (
          <div className="mt-2 text-xs text-purple-700">
            {totalViolations} violation{totalViolations !== 1 ? 's' : ''} recorded
            {severeViolations > 0 && ` (${severeViolations} severe)`}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Documentation Entries:</span>
            <span className="font-medium">{gameData.documentationEntries.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Protocol Violations:</span>
            <span className="font-medium">{totalViolations}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Cells Excavated:</span>
            <span className="font-medium">{excavatedCells}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Artifacts Discovered:</span>
            <span className="font-medium">{discoveredArtifacts}</span>
          </div>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center space-x-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Excellent (80%+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Good (60-79%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Fair (40-59%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Needs Work (<40%)</span>
        </div>
      </div>
    </div>
  );
}
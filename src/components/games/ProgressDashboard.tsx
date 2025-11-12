"use client";

import React from "react";
import { Trophy, Target, Clock, Award, TrendingUp, Star } from "lucide-react";
import { GameType, GameProgress, CertificationStatus } from "../../types";

interface ProgressDashboardProps {
  overallCompletion: number;
  gameProgress: Record<GameType, GameProgress>;
  certificationStatus: CertificationStatus;
  totalGameTime: number;
  totalScore: number;
  recommendations?: string[];
}

export function ProgressDashboard({
  overallCompletion,
  gameProgress,
  certificationStatus,
  totalGameTime,
  totalScore,
  recommendations = [],
}: ProgressDashboardProps) {
  const gameTypes: GameType[] = [
    "artifact_identification",
    "excavation_simulation",
    "site_documentation",
    "historical_timeline",
    "conservation_lab",
  ];

  const gameDisplayNames: Record<GameType, string> = {
    artifact_identification: "Artifact Identification",
    excavation_simulation: "Excavation Simulation",
    site_documentation: "Site Documentation",
    historical_timeline: "Historical Timeline",
    conservation_lab: "Conservation Lab",
  };

  const gameIcons: Record<GameType, string> = {
    artifact_identification: "🏺",
    excavation_simulation: "🤿",
    site_documentation: "📋",
    historical_timeline: "📚",
    conservation_lab: "🧪",
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressTextColor = (percentage: number): string => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getCertificationBadge = () => {
    switch (certificationStatus) {
      case "certified":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-500 rounded-full">
            <Award className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700">Certified</span>
          </div>
        );
      case "eligible":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 border-2 border-blue-500 rounded-full">
            <Star className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-700">
              Eligible for Certification
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-gray-300 rounded-full">
            <Target className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">In Progress</span>
          </div>
        );
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Overall Stats */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Your Progress Dashboard
            </h2>
            <p className="text-gray-600">
              Track your journey to becoming a junior underwater archaeologist
            </p>
          </div>
          {getCertificationBadge()}
        </div>

        {/* Overall Progress Circle */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(overallCompletion / 100) * 439.6} 439.6`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-800">
                  {Math.round(overallCompletion)}%
                </span>
                <span className="text-sm text-gray-600">Complete</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-sm text-gray-600">Total Score</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {totalScore.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-blue-500" />
                <span className="text-sm text-gray-600">Time Spent</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {formatTime(totalGameTime)}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-green-500" />
                <span className="text-sm text-gray-600">Games Completed</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {
                  gameTypes.filter(
                    (gt) =>
                      gameProgress[gt] &&
                      gameProgress[gt].completedLevels >=
                        gameProgress[gt].totalLevels
                  ).length
                }
                /{gameTypes.length}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-500" />
                <span className="text-sm text-gray-600">Avg Score</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {Math.round(
                  gameTypes.reduce(
                    (sum, gt) => sum + (gameProgress[gt]?.averageScore || 0),
                    0
                  ) / gameTypes.length
                )}
                %
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game-Specific Progress */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-600" />
          Game Progress
        </h3>

        <div className="space-y-4">
          {gameTypes.map((gameType) => {
            const progress = gameProgress[gameType] || {
              completedLevels: 0,
              totalLevels: 5,
              bestScore: 0,
              averageScore: 0,
              timeSpent: 0,
              lastPlayed: new Date(0),
              achievements: [],
            };

            const completionPercentage =
              (progress.completedLevels / progress.totalLevels) * 100;

            return (
              <div
                key={gameType}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{gameIcons[gameType]}</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {gameDisplayNames[gameType]}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {progress.completedLevels}/{progress.totalLevels} levels
                        completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${getProgressTextColor(completionPercentage)}`}
                    >
                      {Math.round(completionPercentage)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Best: {progress.bestScore}%
                    </div>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(completionPercentage)}`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Avg Score:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {progress.averageScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {formatTime(progress.timeSpent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Achievements:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {progress.achievements.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            Recommendations
          </h3>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-700">
                <span className="text-orange-500 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

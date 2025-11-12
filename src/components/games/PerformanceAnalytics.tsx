"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Clock,
  Award,
} from "lucide-react";
import { GameType, GameProgress } from "../../types";

interface PerformanceAnalyticsProps {
  gameProgress: Record<GameType, GameProgress>;
}

export function PerformanceAnalytics({
  gameProgress,
}: PerformanceAnalyticsProps) {
  const gameTypes: GameType[] = [
    "artifact_identification",
    "excavation_simulation",
    "site_documentation",
    "historical_timeline",
    "conservation_lab",
  ];

  const gameDisplayNames: Record<GameType, string> = {
    artifact_identification: "Artifact ID",
    excavation_simulation: "Excavation",
    site_documentation: "Documentation",
    historical_timeline: "Timeline",
    conservation_lab: "Conservation",
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalTime = gameTypes.reduce(
      (sum, gt) => sum + (gameProgress[gt]?.timeSpent || 0),
      0
    );
    const avgScore =
      gameTypes.reduce(
        (sum, gt) => sum + (gameProgress[gt]?.averageScore || 0),
        0
      ) / gameTypes.length;
    const bestGame = gameTypes.reduce((best, gt) => {
      const score = gameProgress[gt]?.bestScore || 0;
      const bestScore = gameProgress[best]?.bestScore || 0;
      return score > bestScore ? gt : best;
    }, gameTypes[0]);
    const weakestGame = gameTypes.reduce((weakest, gt) => {
      const score = gameProgress[gt]?.bestScore || 0;
      const weakestScore = gameProgress[weakest]?.bestScore || 0;
      return score < weakestScore ? gt : weakest;
    }, gameTypes[0]);

    return {
      totalTime,
      avgScore,
      bestGame,
      weakestGame,
    };
  }, [gameProgress, gameTypes]);

  const getTrendIcon = (current: number, average: number) => {
    if (current > average + 5) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (current < average - 5) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        Performance Analytics
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Avg Score</span>
          </div>
          <div
            className={`text-3xl font-bold ${getScoreColor(stats.avgScore)}`}
          >
            {Math.round(stats.avgScore)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Best Game</span>
          </div>
          <div className="text-lg font-bold text-green-700">
            {gameDisplayNames[stats.bestGame]}
          </div>
          <div className="text-sm text-gray-600">
            {gameProgress[stats.bestGame]?.bestScore || 0}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">
              Focus Area
            </span>
          </div>
          <div className="text-lg font-bold text-orange-700">
            {gameDisplayNames[stats.weakestGame]}
          </div>
          <div className="text-sm text-gray-600">
            {gameProgress[stats.weakestGame]?.bestScore || 0}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">
              Total Time
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {Math.floor(stats.totalTime / 60)}h
          </div>
          <div className="text-sm text-gray-600">
            {Math.round(stats.totalTime % 60)}m
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Game Type
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                Best Score
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                Avg Score
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                Trend
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                Time Spent
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
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
                <tr
                  key={gameType}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {gameDisplayNames[gameType]}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`font-bold ${getScoreColor(progress.bestScore)}`}
                    >
                      {progress.bestScore}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-gray-700">
                      {progress.averageScore}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex justify-center">
                      {getTrendIcon(progress.bestScore, stats.avgScore)}
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {Math.floor(progress.timeSpent / 60)}h{" "}
                    {Math.round(progress.timeSpent % 60)}m
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            completionPercentage >= 80
                              ? "bg-green-500"
                              : completionPercentage >= 60
                                ? "bg-yellow-500"
                                : "bg-orange-500"
                          }`}
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12">
                        {Math.round(completionPercentage)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-gray-800 mb-2">💡 Insights</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          {stats.avgScore >= 80 && (
            <li>
              • Excellent overall performance! You're mastering the material.
            </li>
          )}
          {stats.avgScore < 60 && (
            <li>
              • Consider reviewing the fundamentals and practicing more
              regularly.
            </li>
          )}
          {gameProgress[stats.weakestGame]?.bestScore < 50 && (
            <li>
              • Focus on improving your {gameDisplayNames[stats.weakestGame]}{" "}
              skills for better overall progress.
            </li>
          )}
          {stats.totalTime < 60 && (
            <li>
              • Spend more time practicing to improve your skills and
              understanding.
            </li>
          )}
          {gameTypes.filter(
            (gt) =>
              gameProgress[gt]?.completedLevels >= gameProgress[gt]?.totalLevels
          ).length >= 3 && (
            <li>
              • Great job completing multiple game types! You're well on your
              way to certification.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

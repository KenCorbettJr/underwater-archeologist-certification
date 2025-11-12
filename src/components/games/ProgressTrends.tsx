"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface ProgressTrendsProps {
  userId: Id<"users">;
  gameType?:
    | "artifact_identification"
    | "excavation_simulation"
    | "site_documentation"
    | "historical_timeline"
    | "conservation_lab";
  days?: number;
}

export function ProgressTrends({
  userId,
  gameType,
  days = 30,
}: ProgressTrendsProps) {
  const trendsData = useQuery(api.progressTracking.getProgressTrends, {
    userId,
    gameType,
    days,
  });

  if (!trendsData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Loading trends...</p>
      </div>
    );
  }

  const { trends, summary } = trendsData;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Total Improvement</p>
          <p
            className={`text-2xl font-bold ${summary.totalImprovement >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {summary.totalImprovement >= 0 ? "+" : ""}
            {summary.totalImprovement.toFixed(1)}%
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Score Change</p>
          <p
            className={`text-2xl font-bold ${summary.averageScoreChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {summary.averageScoreChange >= 0 ? "+" : ""}
            {summary.averageScoreChange.toFixed(0)}
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Total Time</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatTime(summary.totalTimeSpent)}
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Most Active Day</p>
          <p className="text-2xl font-bold text-purple-600">
            {summary.mostActiveDay ? formatDate(summary.mostActiveDay) : "N/A"}
          </p>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Progress Over Time</h3>

        {trends.length === 0 ? (
          <p className="text-gray-600">
            No progress data available for the selected period
          </p>
        ) : (
          <div className="space-y-4">
            {/* Simple bar chart visualization */}
            <div className="space-y-2">
              {trends.map((trend, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {formatDate(trend.date)}
                    </span>
                    <span className="font-medium">
                      {trend.completionPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(trend.completionPercentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Stats Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-600">Date</th>
                    <th className="text-right py-2 px-3 text-gray-600">
                      Completion
                    </th>
                    <th className="text-right py-2 px-3 text-gray-600">
                      Avg Score
                    </th>
                    <th className="text-right py-2 px-3 text-gray-600">
                      Time Spent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map((trend, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3">{formatDate(trend.date)}</td>
                      <td className="text-right py-2 px-3 font-medium">
                        {trend.completionPercentage.toFixed(1)}%
                      </td>
                      <td className="text-right py-2 px-3">
                        {trend.averageScore.toFixed(0)}
                      </td>
                      <td className="text-right py-2 px-3">
                        {formatTime(trend.timeSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      {trends.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-3">Progress Insights</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            {summary.totalImprovement > 0 && (
              <li>
                🎉 Great job! You've improved by{" "}
                {summary.totalImprovement.toFixed(1)}% over the last {days} days
              </li>
            )}
            {summary.averageScoreChange > 0 && (
              <li>
                📈 Your average score has increased by{" "}
                {summary.averageScoreChange.toFixed(0)} points
              </li>
            )}
            {summary.totalTimeSpent > 0 && (
              <li>
                ⏱️ You've spent {formatTime(summary.totalTimeSpent)} learning -
                keep it up!
              </li>
            )}
            {trends.length >= 7 && (
              <li>
                🔥 You've been consistent with {trends.length} days of activity
              </li>
            )}
            {summary.totalImprovement === 0 && trends.length > 0 && (
              <li>
                💪 Keep practicing to see improvement in your completion rate
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdminLayout } from "@/components/admin/AdminLayout";

type TimeRange = "week" | "month" | "quarter";

interface AnalyticsCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function AnalyticsCard({
  title,
  children,
  className = "",
}: AnalyticsCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const dashboardAnalytics = useQuery(
    api.adminAnalytics.getDashboardAnalytics,
    {}
  );
  const engagementMetrics = useQuery(api.adminAnalytics.getEngagementMetrics, {
    timeRange,
  });
  const contentUsageStats = useQuery(
    api.adminAnalytics.getContentUsageStats,
    {}
  );

  const formatGameType = (gameType: string) => {
    return gameType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (!dashboardAnalytics || !engagementMetrics || !contentUsageStats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics & Reporting
            </h1>
            <p className="text-gray-600 mt-2">
              Detailed insights into student engagement and content usage
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label
              htmlFor="timeRange"
              className="text-sm font-medium text-gray-700"
            >
              Time Range:
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">Total Students</h3>
            <p className="text-3xl font-bold mt-2">
              {dashboardAnalytics.overview.totalStudents}
            </p>
            <p className="text-sm opacity-75 mt-1">Registered users</p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">
              Active This{" "}
              {timeRange === "week"
                ? "Week"
                : timeRange === "month"
                  ? "Month"
                  : "Quarter"}
            </h3>
            <p className="text-3xl font-bold mt-2">
              {timeRange === "week"
                ? dashboardAnalytics.studentEngagement.activeThisWeek
                : timeRange === "month"
                  ? dashboardAnalytics.studentEngagement.activeThisMonth
                  : dashboardAnalytics.studentEngagement.activeThisMonth}
            </p>
            <p className="text-sm opacity-75 mt-1">Unique students</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">
              Avg Session Duration
            </h3>
            <p className="text-3xl font-bold mt-2">
              {dashboardAnalytics.studentEngagement.averageSessionDuration}m
            </p>
            <p className="text-sm opacity-75 mt-1">Minutes per session</p>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">
              Certification Rate
            </h3>
            <p className="text-3xl font-bold mt-2">
              {dashboardAnalytics.certificationStats.certificationRate}%
            </p>
            <p className="text-sm opacity-75 mt-1">Of eligible students</p>
          </div>
        </div>

        {/* Daily Activity Chart */}
        <AnalyticsCard title="Daily Active Users">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Date</span>
              <span>Active Users</span>
              <span>New Sessions</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {engagementMetrics.dailyActiveUsers.slice(-14).map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between py-2 border-b border-gray-100"
                >
                  <span className="text-sm font-medium">
                    {formatDate(day.date)}
                  </span>
                  <span className="text-sm">{day.activeUsers}</span>
                  <span className="text-sm text-gray-600">
                    {day.newSessions}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnalyticsCard>

        {/* Game Type Popularity & Certification Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnalyticsCard title="Game Type Popularity">
            <div className="space-y-4">
              {engagementMetrics.gameTypePopularity.map((game) => (
                <div key={game.gameType} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {formatGameType(game.gameType)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {game.sessions} sessions
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((game.sessions / Math.max(...engagementMetrics.gameTypePopularity.map((g) => g.sessions))) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{game.uniqueUsers} unique users</span>
                    <span>Avg score: {game.averageScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Certification Progress">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {engagementMetrics.certificationProgress.certified}
                  </p>
                  <p className="text-sm text-gray-600">Certified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {engagementMetrics.certificationProgress.eligible}
                  </p>
                  <p className="text-sm text-gray-600">Eligible</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {engagementMetrics.certificationProgress.inProgress}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Certification Progress</span>
                  <span>
                    {Math.round(
                      (engagementMetrics.certificationProgress.certified /
                        dashboardAnalytics.overview.totalStudents) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                    style={{
                      width: `${Math.min((engagementMetrics.certificationProgress.certified / dashboardAnalytics.overview.totalStudents) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </AnalyticsCard>
        </div>

        {/* Content Usage Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <AnalyticsCard title="Most Used Artifacts">
            <div className="space-y-3">
              {contentUsageStats.artifactUsage.slice(0, 8).map((artifact) => (
                <div
                  key={artifact.artifactId}
                  className="flex justify-between items-center"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {artifact.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {artifact.category} • {artifact.difficulty}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium">{artifact.timesUsed}</p>
                    <p className="text-xs text-gray-500">uses</p>
                  </div>
                </div>
              ))}
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Popular Excavation Sites">
            <div className="space-y-3">
              {contentUsageStats.siteUsage.slice(0, 8).map((site) => (
                <div
                  key={site.siteId}
                  className="flex justify-between items-center"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {site.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {site.location} • {site.difficulty}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium">{site.timesUsed}</p>
                    <p className="text-xs text-gray-500">uses</p>
                  </div>
                </div>
              ))}
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Challenge Completion Rates">
            <div className="space-y-3">
              {contentUsageStats.challengeCompletion
                .slice(0, 8)
                .map((challenge) => (
                  <div key={challenge.challengeId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {challenge.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {challenge.category} • {challenge.difficulty}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium">
                          {challenge.completionRate}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-600 h-1.5 rounded-full"
                        style={{ width: `${challenge.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </AnalyticsCard>
        </div>

        {/* Export Options */}
        <AnalyticsCard title="Export & Reports">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium text-gray-900">
                  Student Progress Report
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Export detailed student progress data
                </p>
              </div>
            </button>

            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">📈</div>
                <h4 className="font-medium text-gray-900">
                  Engagement Analytics
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Download engagement metrics
                </p>
              </div>
            </button>

            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-medium text-gray-900">
                  Content Usage Report
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Export content performance data
                </p>
              </div>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Export functionality will be available in a future update
          </p>
        </AnalyticsCard>
      </div>
    </AdminLayout>
  );
}

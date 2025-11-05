"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: "blue" | "green" | "purple" | "orange" | "red";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, subtitle, color, trend }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-sm opacity-60 mt-1">{subtitle}</p>}
        </div>
        {trend && (
          <div
            className={`text-sm font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
          >
            {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
}

function QuickAction({
  title,
  description,
  href,
  icon,
  color,
}: QuickActionProps) {
  const colorClasses = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    orange: "bg-orange-600 hover:bg-orange-700",
  };

  return (
    <Link
      href={href}
      className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]} text-white`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export function AdminDashboard() {
  const analytics = useQuery(api.adminAnalytics.getDashboardAnalytics, {});
  const adminLogs = useQuery(api.adminAuth.getAdminLogs, { limit: 10 });

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  const formatGameType = (gameType: string) => {
    return gameType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Overview Metrics */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          System Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="Total Students"
            value={analytics.overview.totalStudents}
            color="blue"
          />
          <MetricCard
            title="Game Sessions"
            value={analytics.overview.totalGameSessions}
            subtitle="All time"
            color="green"
          />
          <MetricCard
            title="Artifacts"
            value={analytics.overview.totalArtifacts}
            color="purple"
          />
          <MetricCard
            title="Excavation Sites"
            value={analytics.overview.totalExcavationSites}
            color="orange"
          />
          <MetricCard
            title="Challenges"
            value={analytics.overview.totalChallenges}
            color="red"
          />
        </div>
      </div>

      {/* Student Engagement */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Student Engagement
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Today"
            value={analytics.studentEngagement.activeToday}
            subtitle="students"
            color="green"
          />
          <MetricCard
            title="Active This Week"
            value={analytics.studentEngagement.activeThisWeek}
            subtitle="students"
            color="blue"
          />
          <MetricCard
            title="Active This Month"
            value={analytics.studentEngagement.activeThisMonth}
            subtitle="students"
            color="purple"
          />
          <MetricCard
            title="Avg Session Duration"
            value={`${analytics.studentEngagement.averageSessionDuration}m`}
            subtitle="minutes"
            color="orange"
          />
        </div>
      </div>

      {/* Content Usage & Certification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Content Usage */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Content Usage
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Most Popular Game</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatGameType(analytics.contentUsage.mostPopularGameType)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                Difficulty Distribution
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Beginner</span>
                  <span className="text-sm font-medium">
                    {analytics.contentUsage.difficultyDistribution.beginner}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Intermediate</span>
                  <span className="text-sm font-medium">
                    {analytics.contentUsage.difficultyDistribution.intermediate}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Advanced</span>
                  <span className="text-sm font-medium">
                    {analytics.contentUsage.difficultyDistribution.advanced}
                  </span>
                </div>
              </div>
            </div>

            {analytics.contentUsage.gameTypeStats.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Top Game Types</p>
                <div className="space-y-1">
                  {analytics.contentUsage.gameTypeStats
                    .slice(0, 3)
                    .map((game, index) => (
                      <div
                        key={game.gameType}
                        className="flex justify-between items-center text-sm"
                      >
                        <span>{formatGameType(game.gameType)}</span>
                        <span className="font-medium">
                          {game.totalSessions} sessions
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certification Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Certification Status
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {analytics.certificationStats.totalCertified}
                </p>
                <p className="text-sm text-green-700">Certified</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.certificationStats.eligibleForCertification}
                </p>
                <p className="text-sm text-blue-700">Eligible</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">Certification Rate</p>
              <p className="text-3xl font-bold text-purple-600">
                {analytics.certificationStats.certificationRate}%
              </p>
            </div>

            {analytics.certificationStats.recentCertifications.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Recent Certifications
                </p>
                <div className="space-y-1">
                  {analytics.certificationStats.recentCertifications
                    .slice(0, 3)
                    .map((cert, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{cert.studentName}</span>
                        <span className="text-gray-500 ml-2">
                          {formatTimestamp(cert.issueDate)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickAction
            title="Manage Artifacts"
            description="Add, edit, or remove artifacts from the collection"
            href="/admin/artifacts"
            icon="🏺"
            color="purple"
          />
          <QuickAction
            title="Manage Sites"
            description="Configure excavation sites and difficulty levels"
            href="/admin/sites"
            icon="🏛️"
            color="orange"
          />
          <QuickAction
            title="Manage Challenges"
            description="Create and update learning challenges"
            href="/admin/challenges"
            icon="🎯"
            color="green"
          />
          <QuickAction
            title="View Students"
            description="Monitor student progress and certifications"
            href="/admin/users"
            icon="👥"
            color="blue"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Student Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Student Activity
          </h3>
          {analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 8).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.description}</p>
                    <p className="text-gray-500 text-xs">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>

        {/* Recent Admin Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Admin Actions
          </h3>
          {adminLogs && adminLogs.length > 0 ? (
            <div className="space-y-3">
              {adminLogs.slice(0, 8).map((log) => (
                <div
                  key={log._id}
                  className="flex items-start space-x-3 text-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">
                      {log.action
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    {log.details && (
                      <p className="text-gray-600 text-xs mt-1">
                        {log.details}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs">
                      {formatTimestamp(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No recent admin actions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
